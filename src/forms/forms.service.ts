import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { ContactDto } from './dto/contact.dto'
import { SubscribeDto } from './dto/subscribe.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { SubscriberRecord } from './interfaces/forms.interface'
import { MailService } from '../mail/mail.service'
import { BlogService } from '../blog/blog.service'
import { companyConfig } from '../config/company.config'
// Librerías anti-spam
import disposableDomains from 'disposable-email-domains'
import { validate } from 'deep-email-validator'

import { SystemConfigService } from '../system-config/system-config.service'
import { SubscriberResponseDto } from './dto/form-response.dto'
import { TemplateService } from '../templates/template.service'
import { BienvenidaContacto } from '../templates/react/bienvenida-contacto'
import * as React from 'react'

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name)

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly blogService: BlogService,
    private readonly systemConfigService: SystemConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly templateService: TemplateService,
  ) {}

  // Eliminado mapProspectToDto

  private mapSubscriberToDto(data: SubscriberRecord): SubscriberResponseDto {
    return {
      id: data.subscriberId,
      email: data.email,
      status: data.status as 'pending' | 'confirmed' | 'unsubscribed',
      subscribedAt: data.createdAt,
      confirmedAt: data.confirmedAt,
      meta: data.meta,
    }
  }

  // ================================================
  // Métodos de Validación Anti-Spam
  // ================================================

  private isDisposableDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return true
    return (disposableDomains as string[]).includes(domain)
  }

  private async validateMxRecords(email: string): Promise<boolean> {
    try {
      const result = await validate({
        email,
        sender: email,
        validateRegex: false,
        validateMx: true,
        validateTypo: false,
        validateDisposable: false,
        validateSMTP: false,
      })
      return result.valid
    } catch {
      return true // Permisivo si falla el lookup DNS
    }
  }

  private async verifyTurnstileToken(token: string): Promise<boolean> {
    const secret = this.configService.get<string>('TURNSTILE_SECRET_KEY')
    if (!secret) return true // Permisivo si no está configurado (dev local)
    try {
      const res = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, response: token }),
        },
      )
      const data = (await res.json()) as { success: boolean }
      return data.success
    } catch {
      return true // Permisivo si Cloudflare no responde
    }
  }

  // Método principal del flujo
  async handleContact(contactDto: ContactDto & { turnstileToken?: string }) {
    try {
      // 0. Validaciones anti-spam
      // 0a. Cloudflare Turnstile
      if (contactDto.turnstileToken) {
        const turnstileOk = await this.verifyTurnstileToken(
          contactDto.turnstileToken,
        )
        if (!turnstileOk) {
          throw new BadRequestException(
            'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.',
          )
        }
      }

      // 0b. Dominio desechable
      if (this.isDisposableDomain(contactDto.email)) {
        return {
          success: false,
          message:
            'Por favor usa un correo electrónico permanente. No aceptamos correos temporales.',
        }
      }

      // 0c. Registros MX (el dominio del email existe y recibe correos)
      const mxOk = await this.validateMxRecords(contactDto.email)
      if (!mxOk) {
        return {
          success: false,
          message:
            'El correo electrónico no parece válido. Verifica que esté escrito correctamente.',
        }
      }

      // 1. Recibir formulario (ya validado por el DTO)

      // 2. Comprobar si existe contacto
      const existingContacto = await this.firebaseService.findContactoByEmail(
        contactDto.email,
      )

      // 3. Generar respuesta personalizada
      const responseContent = await this.generateResponse(
        contactDto,
        existingContacto,
      )

      // 4. Guardar contacto
      const contactoId = await this.firebaseService.saveContacto({
        name: contactDto.name,
        email: contactDto.email,
        phone: contactDto.phone || '',
        origen: 'formulario_contacto',
      })

      // 5. Crear consulta asociada
      const consultaId = await this.firebaseService.addConsultaToContacto(
        contactoId,
        {
          contenido: contactDto.message,
          estado: 'respondida_automaticamente',
          meta: contactDto.meta,
          respuesta: {
            fecha: new Date(),
            contenido: responseContent,
            emailSent: false,
          },
        },
      )

      // 6. Enviar repuesta por correo
      const emailSent = await this.sendResponseEmail(
        contactDto,
        responseContent,
        !existingContacto,
      )

      // 7. Enviar notificación al administrador
      const adminNotified = await this.sendAdminNotificationEmail(
        contactDto,
        responseContent,
        !existingContacto,
      )

      // 8. Marcar email como enviado en la consulta
      if (emailSent) {
        await this.firebaseService.markConsultaEmailAsSent(
          contactoId,
          consultaId,
        )
      }

      return {
        success: true,
        message: 'Formulario procesado correctamente',
        contactoId,
        consultaId,
        emailSent,
        adminNotified,
        isNewProspect: !existingContacto,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      this.logger.error(`Error procesando formulario: ${errorMessage}`)
      if (error instanceof HttpException) {
        throw error
      }
      throw new InternalServerErrorException(
        'Error procesando el formulario de contacto',
      )
    }
  }

  // Método para generar respuesta personalizada con IA
  private generateResponse(
    contactDto: ContactDto,
    existingContacto?: any,
  ): Promise<string> {
    try {
      // Temporalmente deshabilitado - falta configurar API keys de IA
      /* 
      const aiResponse = await this.aiService.generateResponse(
        contactDto,
        existingContacto || undefined,
      );
      
      console.log(`Respuesta generada por ${aiResponse.provider} en ${aiResponse.processingTime}ms`);
      return aiResponse.content;
      */

      // Fallback a respuesta estática por ahora
      if (existingContacto) {
        return Promise.resolve(
          `Hola ${contactDto.name}, recibí tu mensaje. Te contactaré con prioridad en menos de 12 horas.`,
        )
      } else {
        return Promise.resolve(
          `Hola ${contactDto.name}, recibí tu mensaje. Te contactaré en menos de 24 horas.`,
        )
      }
    } catch (error) {
      console.error('Error generando respuesta:', error)

      // Fallback a respuesta estática
      if (existingContacto) {
        return Promise.resolve(
          `Hola ${contactDto.name}, recibí tu mensaje. Te contactaré con prioridad en menos de 12 horas.`,
        )
      } else {
        return Promise.resolve(
          `Hola ${contactDto.name}, recibí tu mensaje. Te contactaré en menos de 24 horas.`,
        )
      }
    }
  }

  // Método para enviar respuesta por correo
  private async sendResponseEmail(
    contactDto: ContactDto,
    responseContent: string,
    esContactoNuevo: boolean,
  ): Promise<boolean> {
    try {
      const subject = esContactoNuevo
        ? `Gracias por contactarnos, ${contactDto.name}`
        : `¡Qué gusto verte de nuevo, ${contactDto.name}!`

      const baseVars = this.mailService.getBaseVariables(contactDto.email)

      if (esContactoNuevo) {
        return await this.mailService.sendMail({
          to: contactDto.email,
          subject,
          html: await this.templateService.renderReactTemplate(
            React.createElement(BienvenidaContacto, {
              ...baseVars,
              prospectName: contactDto.name,
              previewText: 'Gracias por contactarme. He recibido tu mensaje.',
              websiteUrl: baseVars['websiteUrl'] as string,
              calendlyUrl: baseVars['calendlyUrl'] as string,
              logoUrl: baseVars['logoUrl'] as string,
              companyName: baseVars['companyName'] as string,
              address: baseVars['address'] as string,
              email: baseVars['email'] as string,
              currentYear: baseVars['currentYear'] as string,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              social: baseVars['social'] as any,
            }),
          ),
        })
      }

      const RegresoContactoComponent = (
        await import('../templates/react/regreso-contacto')
      ).RegresoContacto
      return await this.mailService.sendMail({
        to: contactDto.email,
        subject,
        html: await this.templateService.renderReactTemplate(
          React.createElement(RegresoContactoComponent, {
            ...baseVars,
            prospectName: contactDto.name,
            previewText: '¡Qué gusto saludarte de nuevo!',
            websiteUrl: baseVars['websiteUrl'] as string,
            calendlyUrl: baseVars['calendlyUrl'] as string,
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error('Error enviando email:', error)
      return false
    }
  }

  // Método para enviar notificación al administrador
  private async sendAdminNotificationEmail(
    contactDto: ContactDto,
    responseContent: string,
    esContactoNuevo: boolean,
  ): Promise<boolean> {
    try {
      const config = await this.systemConfigService.getConfig()
      const adminEmail = config?.email || companyConfig.email

      const baseVars = this.mailService.getBaseVariables(adminEmail)
      const AdminContactComponent = (
        await import('../templates/react/admin-contact')
      ).AdminContact

      return await this.mailService.sendMail({
        to: adminEmail,
        subject: `Nuevo mensaje de contacto ${esContactoNuevo ? '(NUEVO)' : '(RECURRENTE)'} - ${contactDto.name}`,
        html: await this.templateService.renderReactTemplate(
          React.createElement(AdminContactComponent, {
            ...baseVars,
            typeLabel: esContactoNuevo
              ? 'PRIMER CONTACTO (CONTACTO NUEVO)'
              : 'CONTACTO RECURRENTE',
            contactName: contactDto.name,
            contactEmail: contactDto.email,
            contactPhone: contactDto.phone || 'No proporcionado',
            contactMessage: contactDto.message,
            autoResponse: responseContent,
            date: new Date().toLocaleString('es-ES'),
            previewText: 'Nuevo mensaje de contacto recibido en la web',
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error('Error enviando notificación administrativa:', error)
      return false
    }
  }

  // Método para enviar notificación de nueva suscripción al administrador
  private async sendAdminSubscriptionNotification(
    subscribeDto: SubscribeDto,
  ): Promise<boolean> {
    try {
      const config = await this.systemConfigService.getConfig()
      const adminEmail = config?.email || companyConfig.email

      const baseVars = this.mailService.getBaseVariables(adminEmail)
      const AdminSubscriptionComponent = (
        await import('../templates/react/admin-subscription')
      ).AdminSubscription

      return await this.mailService.sendMail({
        to: adminEmail,
        subject: `🔔 Nueva suscripción al newsletter`,
        html: await this.templateService.renderReactTemplate(
          React.createElement(AdminSubscriptionComponent, {
            ...baseVars,
            subscriberEmail: subscribeDto.email,
            date: new Date().toLocaleString('es-ES'),
            pageOrigin: subscribeDto.meta.page,
            referrer: subscribeDto.meta.referrer || 'Directo',
            userAgent: subscribeDto.meta.userAgent,
            previewText: 'Nueva suscripción al newsletter',
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error('Error enviando notificación de suscripción:', error)
      return false
    }
  }

  // Método para enviar email de bienvenida a suscriptores
  private async sendSubscriberWelcomeEmail(email: string): Promise<boolean> {
    try {
      const baseVars = this.mailService.getBaseVariables(email)
      const SubscriberWelcomeComponent = (
        await import('../templates/react/subscriber-welcome')
      ).SubscriberWelcome

      return await this.mailService.sendMail({
        to: email,
        subject: '¡Bienvenido/a a mi newsletter! 🎉',
        html: await this.templateService.renderReactTemplate(
          React.createElement(SubscriberWelcomeComponent, {
            ...baseVars,
            previewText: 'Bienvenido al newsletter oficial de Gabriel Zavando',
            websiteUrl: baseVars['websiteUrl'] as string,
            unsubscribeUrl: baseVars['unsubscribeUrl'] as string,
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error)
      return false
    }
  }

  // Manejo de desuscripción: elimina email de la colección 'subscribers'
  async handleUnsubscribe(email: string) {
    try {
      // Verificar si existe el suscriptor
      const existing = await this.firebaseService.findSubscriberByEmail(email)
      if (!existing) {
        return {
          success: true,
          message: 'El email no estaba suscrito o ya fue eliminado',
          wasSubscribed: false,
        }
      }

      const removed = await this.firebaseService.removeSubscriber(email)

      // Enviar email de confirmación de desuscripción
      const emailSent = await this.sendUnsubscribeConfirmationEmail(email)

      return {
        success: true,
        message: 'Te has desuscrito correctamente de nuestro newsletter',
        wasSubscribed: true,
        removed,
        emailSent,
      }
    } catch (error) {
      console.error('Error procesando desuscripción:', error)
      return {
        success: false,
        message: 'Error procesando la desuscripción',
        error: (error as Error).message,
      }
    }
  }

  // Método para enviar email de confirmación de desuscripción
  private async sendUnsubscribeConfirmationEmail(
    email: string,
  ): Promise<boolean> {
    try {
      const baseVars = this.mailService.getBaseVariables(email)
      const UnsubscribeConfirmationComponent = (
        await import('../templates/react/unsubscribe-confirmation')
      ).UnsubscribeConfirmation
      return await this.mailService.sendMail({
        to: email,
        subject: 'Confirmación de desuscripción - Newsletter',
        html: await this.templateService.renderReactTemplate(
          React.createElement(UnsubscribeConfirmationComponent, {
            ...baseVars,
            previewText: 'Confirmación de desuscripción',
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error(
        'Error enviando email de confirmación de desuscripción:',
        error,
      )
      return false
    }
  }

  // Método para probar la conexión a Firebase
  async testFirebaseConnection() {
    return await this.firebaseService.testConnection()
  }

  testMailConnection() {
    return this.mailService.testConnection()
  }

  // Manejo de suscripciones: guarda email + meta en colección 'subscribers'
  async handleSubscribe(
    subscribeDto: SubscribeDto & { turnstileToken?: string },
  ) {
    try {
      // Validaciones anti-spam
      // 1. Cloudflare Turnstile
      if (subscribeDto.turnstileToken) {
        const turnstileOk = await this.verifyTurnstileToken(
          subscribeDto.turnstileToken,
        )
        if (!turnstileOk) {
          return {
            success: false,
            message:
              'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.',
          }
        }
      }

      // 2. Dominio desechable
      if (this.isDisposableDomain(subscribeDto.email)) {
        return {
          success: false,
          message:
            'Por favor usa un correo permanente. No aceptamos correos temporales.',
        }
      }

      // 3. Registros MX
      const mxOk = await this.validateMxRecords(subscribeDto.email)
      if (!mxOk) {
        return {
          success: false,
          message:
            'El correo no parece válido. Verifica que esté escrito correctamente.',
        }
      }

      // 4. Verificar si ya existe
      const existing = await this.firebaseService.findSubscriberByEmail(
        subscribeDto.email,
      )
      if (existing) {
        return {
          success: true,
          alreadySubscribed: true,
          message:
            'El correo ya está suscrito. Revisa tu bandeja para confirmar si está pendiente.',
          subscriberId: existing.subscriberId,
        }
      }

      // 5. Guardar suscriptor en estado 'pending' con token de confirmación
      const subscriberId =
        await this.firebaseService.saveSubscriber(subscribeDto)

      // 6. Obtener el token generado para enviarlo en el email
      const confirmationToken =
        await this.firebaseService.getSubscriberConfirmationToken(subscriberId)

      // 7. Enviar email de confirmación (Double Opt-In)
      if (confirmationToken) {
        await this.sendDoubleOptInEmail(subscribeDto.email, confirmationToken)
      }

      return {
        success: true,
        alreadySubscribed: false,
        pending: true,
        message:
          '\u00a1Casi listo! Te enviamos un correo de confirmación. Haz clic en el enlace para activar tu suscripción.',
        subscriberId,
      }
    } catch (error) {
      console.error('Error registrando suscripción:', error)
      return {
        success: false,
        message: 'Error registrando la suscripción',
        error: (error as Error).message,
      }
    }
  }

  // getAllProspects, getProspectById y adminReplyToProspect eliminados.

  // Obtener todos los suscriptores
  async getAllSubscribers(): Promise<SubscriberResponseDto[]> {
    const subscribers = await this.firebaseService.getAllSubscribers()
    return subscribers.map((s) => this.mapSubscriberToDto(s))
  }

  async verifySubscription(
    token: string,
  ): Promise<{ success: boolean; email?: string }> {
    return await this.firebaseService.confirmSubscriber(token)
  }

  async getSystemConfig() {
    return await this.systemConfigService.getConfig()
  }

  // Email de confirmación para Double Opt-In
  private async sendDoubleOptInEmail(
    email: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.systemConfigService.getConfig()
      const websiteUrl = config?.websiteUrl || companyConfig.websiteUrl
      const confirmUrl = `${websiteUrl.replace(/\/+$/, '')}/api/forms/verify-subscription/${token}`

      const baseVars = this.mailService.getBaseVariables(email)
      const SubscriberDoubleOptInComponent = (
        await import('../templates/react/subscriber-double-opt-in')
      ).SubscriberDoubleOptIn

      return await this.mailService.sendMailDetailed({
        to: email,
        subject: 'Confirma tu suscripción al Newsletter',
        html: await this.templateService.renderReactTemplate(
          React.createElement(SubscriberDoubleOptInComponent, {
            ...baseVars,
            confirmationUrl: confirmUrl,
            previewText:
              'Confirma tu suscripción para empezar a recibir contenido',
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error('Error enviando email de confirmación:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // ================================================
  // Acciones en Lote (Bulk) para Suscriptores
  // ================================================

  async bulkDeleteSubscribers(subscriberIds: string[]) {
    if (!subscriberIds || subscriberIds.length === 0) {
      return { success: false, message: 'No se enviaron IDs para eliminar' }
    }

    const count =
      await this.firebaseService.bulkDeleteSubscribers(subscriberIds)
    return {
      success: true,
      message: `Se han eliminado físicamente ${count} suscriptores correctamente.`,
      count,
    }
  }

  async bulkConfirmSubscribers(subscriberIds: string[]) {
    if (!subscriberIds || subscriberIds.length === 0) {
      return { success: false, message: 'No se enviaron IDs para confirmar' }
    }

    const allSubscribers = await this.firebaseService.getAllSubscribers()

    const targets = allSubscribers.filter((s) =>
      subscriberIds.includes(s.subscriberId),
    )

    let sent = 0
    let skipped = 0
    let errors = 0
    const details: string[] = []

    for (const sub of targets) {
      const email = sub.email
      try {
        const subId = sub.subscriberId
        const newToken =
          await this.firebaseService.refreshReconfirmationToken(subId)

        if (!newToken) {
          skipped++
          details.push(`⚠️ ${email}: sin ID válido`)
          continue
        }

        // Delay preventivo para evitar ser baneados por SPAM en el SMTP
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const result = await this.sendReconfirmationEmail(email, newToken)
        if (result.success) {
          sent++
          details.push(`✅ ${email}: email de confirmación enviado`)
        } else {
          errors++
          details.push(`❌ ${email}: ${result.error || 'fallo al enviar'}`)
        }
      } catch (err) {
        errors++
        details.push(`❌ ${email}: ${(err as Error).message}`)
      }
    }

    if (sent > 0) {
      await this.ensureCronIsRunning()
    }

    return {
      success: true,
      message: `Proceso de confirmación en lote completado.`,
      sent,
      skipped,
      errors,
      details,
    }
  }

  // --- Métodos de Administración de Contactos ---

  async getAllContactos() {
    return this.firebaseService.getAllContactos()
  }

  async getContactoFullDetail(contactoId: string) {
    const contacto = await this.firebaseService.getContactoById(contactoId)
    if (!contacto) return null

    const consultas =
      await this.firebaseService.getConsultasForContacto(contactoId)
    const diagnosticos =
      await this.firebaseService.getDiagnosticosForContacto(contactoId)

    return {
      ...contacto,
      consultas,
      diagnosticos,
    }
  }

  async addAdminReplyToConsulta(
    contactoId: string,
    consultaId: string,
    replyContent: string,
  ) {
    const contacto = await this.firebaseService.getContactoById(contactoId)
    if (!contacto) throw new Error('Contacto no encontrado')

    await this.firebaseService.addAdminReplyToConsulta(
      contactoId,
      consultaId,
      replyContent,
    )

    return { success: true }
  }

  // ================================================
  // Campaña de Re-confirmación de Suscriptores (TODOS)
  // ================================================

  async runReconfirmationCampaign(): Promise<{
    sent: number
    skipped: number
    errors: number
    details: string[]
  }> {
    this.logger.log('Iniciando campaña de re-confirmación masiva...')
    const subscribers = await this.firebaseService.getAllSubscribers()

    // Enviar a todos excepto a los ya confirmados
    const targets = subscribers.filter((s) => s.status !== 'confirmed')

    let sent = 0
    let skipped = 0
    let errors = 0
    const details: string[] = []

    for (const sub of targets) {
      const email = sub.email
      try {
        // Generar nuevo token de re-confirmación
        const subId = sub.subscriberId
        const newToken =
          await this.firebaseService.refreshReconfirmationToken(subId)

        if (!newToken) {
          skipped++
          details.push(`⚠️ ${email}: sin ID válido`)
          continue
        }

        // Delay preventivo mayor para evitar ban
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const result = await this.sendReconfirmationEmail(email, newToken)
        if (result.success) {
          sent++
          details.push(`✅ ${email}: email enviado`)
        } else {
          errors++
          details.push(`❌ ${email}: ${result.error || 'fallo al enviar'}`)
        }
      } catch (err) {
        errors++
        details.push(`❌ ${email}: ${(err as Error).message}`)
      }
    }
    if (sent > 0) {
      await this.ensureCronIsRunning()
    }

    return { sent, skipped, errors, details }
  }

  // Email de re-confirmación para campañas o procesos manuales
  private async sendReconfirmationEmail(
    email: string,
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.systemConfigService.getConfig()
      const websiteUrl = config?.websiteUrl || companyConfig.websiteUrl
      const confirmUrl = `${websiteUrl.replace(/\/+$/, '')}/api/forms/verify-subscription/${token}`

      const baseVars = this.mailService.getBaseVariables(email)
      const SubscriberReconfirmationComponent = (
        await import('../templates/react/subscriber-reconfirmation')
      ).SubscriberReconfirmation

      return await this.mailService.sendMailDetailed({
        to: email,
        subject: '¿Sigues interesado? Confirma tu suscripción',
        html: await this.templateService.renderReactTemplate(
          React.createElement(SubscriberReconfirmationComponent, {
            ...baseVars,
            reconfirmationUrl: confirmUrl,
            previewText:
              '¿Sigues ahí? Queremos asegurarnos de que quieras seguir recibiendo correos',
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (error) {
      console.error('Error enviando email de re-confirmación:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  // ================================================
  // Limpieza de Suscriptores Inactivos
  // ================================================

  async cleanupInactiveSubscribers(daysThreshold = 7): Promise<{
    marked: number
    total: number
    details: string[]
  }> {
    const subscribers = await this.firebaseService.getAllSubscribers()
    const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000

    // Candidatos: pending/active con reconfirmación enviada antes del umbral
    const targets = subscribers.filter((s) => {
      if (s.status === 'confirmed') return false
      const reconfAt = s.reconfirmationSentAt
      if (!reconfAt) return false

      const reconfTs =
        reconfAt instanceof Date ? reconfAt.getTime() : reconfAt.toMillis()
      return reconfTs < cutoff
    })

    let marked = 0
    const details: string[] = []

    for (const sub of targets) {
      try {
        await this.firebaseService.markSubscriberInactive(sub.subscriberId)
        marked++
        details.push(`✅ ${sub.email}: marcado como inactivo`)
      } catch (err) {
        details.push(`❌ ${sub.email}: ${(err as Error).message}`)
      }
    }

    return { marked, total: targets.length, details }
  }

  // Enviar boletín a una lista de suscriptores
  async sendNewsletterToSubscribers(subscriberIds: string[], postId: string) {
    const post = await this.blogService.findOne(postId)
    if (!post) {
      return { success: false, message: 'Artículo no encontrado' }
    }

    const allSubscribers = await this.firebaseService.getAllSubscribers()
    const targets = allSubscribers.filter(
      (s) => subscriberIds.includes(s.subscriberId) && s.status === 'confirmed',
    )

    let sent = 0
    let errors = 0

    for (const sub of targets) {
      try {
        const contact = await this.firebaseService.findContactoByEmail(
          sub.email,
        )
        const subscriberName = contact?.name || 'ahí'

        const baseVars = this.mailService.getBaseVariables(sub.email)
        const NewsletterComponent = (
          await import('../templates/react/newsletter')
        ).Newsletter

        await this.mailService.sendMailDetailed({
          to: sub.email,
          subject: post.title,
          html: await this.templateService.renderReactTemplate(
            React.createElement(NewsletterComponent, {
              ...baseVars,
              subscriberName,
              postTitle: post.title,
              postExcerpt: post.excerpt || '',
              postUrl: `${companyConfig.websiteUrl}/blog/${post.slug}`,
              postImage: post.coverImage || undefined,
              unsubscribeUrl: `${companyConfig.websiteUrl}/api/forms/unsubscribe/${sub.subscriberId}`,
              previewText: 'Últimas noticias y actualizaciones',
              logoUrl: baseVars['logoUrl'] as string,
              companyName: baseVars['companyName'] as string,
              address: baseVars['address'] as string,
              email: baseVars['email'] as string,
              currentYear: baseVars['currentYear'] as string,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              social: baseVars['social'] as any,
            }),
          ),
        })
        sent++
        // Delay preventivo
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        errors++
        console.error(`Error enviando newsletter a ${sub.email}:`, error)
      }
    }

    return {
      success: true,
      message: `Envío completado: ${sent} exitosos, ${errors} errores.`,
      sent,
      errors,
    }
  }

  // Exportar suscriptores
  async exportSubscribers() {
    return this.getAllSubscribers()
  }

  // ================================================
  // CRON: Suscriptores no confirmados en 72h → 'unconfirmed'
  // Se ejecuta cada 3 días (72 horas) a la medianoche
  // ================================================

  @Cron('0 0 */3 * *', { name: 'RECONFIRMATION_CLEANUP' })
  async cronMarkUnconfirmed() {
    this.logger.log('Cron: verificando suscriptores sin confirmar en 72h...')
    try {
      // 1. Verificar si existen suscriptores en estado 'sent' antes de procesar
      const allSubscribers = await this.firebaseService.getAllSubscribers()
      const hasWork = allSubscribers.some((s) => s.status === 'sent')

      if (!hasWork) {
        await this.schedulerRegistry.getCronJob('RECONFIRMATION_CLEANUP').stop()
        return
      }

      const count = await this.firebaseService.markSubscribersUnconfirmed(72)

      // 2. Si después de procesar ya no quedan suscriptores en 'sent', detener el cron
      const remaining =
        allSubscribers.filter((s) => s.status === 'sent').length - count
      if (remaining <= 0) {
        await this.schedulerRegistry.getCronJob('RECONFIRMATION_CLEANUP').stop()
      }
    } catch (err) {
      this.logger.error('Cron markUnconfirmed error:', (err as Error).message)
    }
  }

  // Activa el cron si está detenido
  private async ensureCronIsRunning() {
    try {
      const job = this.schedulerRegistry.getCronJob(
        'RECONFIRMATION_CLEANUP',
      ) as unknown as {
        running: boolean
        start: () => Promise<void>
      }
      if (!job.running) {
        await job.start()
      }
    } catch (e) {
      this.logger.error(
        'Error al intentar reactivar el Cron:',
        (e as Error).message,
      )
    }
  }
}
