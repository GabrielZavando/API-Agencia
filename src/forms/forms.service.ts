import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ContactDto } from './dto/contact.dto'
import { SubscribeDto } from './dto/subscribe.dto'
import { FirebaseService, ProspectRecord } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { companyConfig } from '../config/company.config'
// Librerías anti-spam
import disposableDomains from 'disposable-email-domains'
import { validate } from 'deep-email-validator'

@Injectable()
export class FormsService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

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
          return {
            success: false,
            message:
              'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.',
          }
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

      // 2. Buscar prospecto
      const existingProspect = await this.findProspect(contactDto.email)

      // 3. Generar respuesta personalizada con IA
      const responseContent = await this.generateResponse(
        contactDto,
        existingProspect,
      )

      let prospectId: string
      let conversationId: string

      if (!existingProspect) {
        // 4a. Crear nuevo prospecto con primera conversación
        prospectId = await this.storeNewProspect(contactDto, responseContent)
        conversationId = 'first_conversation' // Se genera internamente
      } else {
        // 4b. Agregar nueva conversación a prospecto existente
        prospectId = existingProspect.prospectId
        conversationId = await this.storeNewConversation(
          prospectId,
          contactDto,
          responseContent,
        )
      }

      // 5. Enviar respuesta por correo
      const emailSent = await this.sendResponseEmail(
        contactDto,
        responseContent,
        !existingProspect,
      )

      // 6. Enviar notificación al administrador
      const adminNotified = await this.sendAdminNotificationEmail(
        contactDto,
        responseContent,
        !existingProspect,
      )

      // 7. Marcar email como enviado en Firebase
      if (emailSent) {
        await this.firebaseService.markEmailAsSent(prospectId, conversationId)
      }

      return {
        success: true,
        message: 'Formulario procesado correctamente',
        prospectId,
        conversationId,
        emailSent,
        adminNotified,
        isNewProspect: !existingProspect,
      }
    } catch (error) {
      console.error('Error procesando formulario:', error)
      return {
        success: false,
        message: 'Error procesando el formulario',
        error: (error as Error).message,
      }
    }
  }

  // Método para buscar prospectos
  private async findProspect(email: string): Promise<ProspectRecord | null> {
    return await this.firebaseService.findProspectByEmail(email)
  }

  // Método para almacenar nuevo prospecto
  private async storeNewProspect(
    contactDto: ContactDto,
    responseContent: string,
  ): Promise<string> {
    return await this.firebaseService.createProspectWithConversation(
      contactDto,
      responseContent,
    )
  }

  // Método para guardar nueva conversación
  private async storeNewConversation(
    prospectId: string,
    contactDto: ContactDto,
    responseContent: string,
  ): Promise<string> {
    return await this.firebaseService.addConversationToProspect(
      prospectId,
      contactDto,
      responseContent,
    )
  }

  // Método para generar respuesta personalizada con IA
  private generateResponse(
    contactDto: ContactDto,
    existingProspect?: ProspectRecord | null,
  ): Promise<string> {
    try {
      // Temporalmente deshabilitado - falta configurar API keys de IA
      /* 
      const aiResponse = await this.aiService.generateProspectResponse(
        contactDto,
        existingProspect || undefined,
      );
      
      console.log(`Respuesta generada por ${aiResponse.provider} en ${aiResponse.processingTime}ms`);
      return aiResponse.content;
      */

      // Fallback a respuesta estática por ahora (alineada con el contenido del email)
      if (existingProspect) {
        return Promise.resolve(
          `Hola ${contactDto.name}, he recibido tu nuevo mensaje y te responderé con prioridad en un plazo máximo de 12 horas.`,
        )
      } else {
        return Promise.resolve(
          `Hola ${contactDto.name}, he recibido tu mensaje y te responderé en un plazo máximo de 24 horas.`,
        )
      }
    } catch (error) {
      console.error('Error generando respuesta:', error)

      // Fallback a respuesta estática
      if (existingProspect) {
        return Promise.resolve(
          `Hola ${contactDto.name}, he recibido tu nuevo mensaje y te responderé con prioridad en un plazo máximo de 12 horas.`,
        )
      } else {
        return Promise.resolve(
          `Hola ${contactDto.name}, he recibido tu mensaje y te responderé en un plazo máximo de 24 horas.`,
        )
      }
    }
  }

  // Método para enviar respuesta por correo
  private async sendResponseEmail(
    contactDto: ContactDto,
    responseContent: string,
    isNewProspect: boolean,
  ): Promise<boolean> {
    try {
      const templateName = isNewProspect
        ? 'welcome-prospect'
        : 'returning-prospect'

      const subject = isNewProspect
        ? `Gracias por contactarnos, ${contactDto.name}`
        : `¡Qué gusto verte de nuevo, ${contactDto.name}!`

      return await this.mailService.sendMail({
        to: contactDto.email,
        subject,
        templateName,
        templateVariables: {
          name: contactDto.name,
          message: contactDto.message,
          responseContent,
        },
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
    isNewProspect: boolean,
  ): Promise<boolean> {
    try {
      const adminEmail = companyConfig.email

      return await this.mailService.sendMail({
        to: adminEmail,
        subject: `Nuevo mensaje de contacto ${isNewProspect ? '(NUEVO)' : '(RECURRENTE)'} - ${contactDto.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #FF0080; padding-bottom: 10px;">
              📧 Nuevo mensaje de contacto ${isNewProspect ? '<span style="color: #FF0080;">(PRIMER CONTACTO)</span>' : '<span style="color: #A600FF;">(CONTACTO RECURRENTE)</span>'}
            </h2>

            <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">📋 Información del contacto:</h3>
              <p><strong>Nombre:</strong> ${contactDto.name}</p>
              <p><strong>Email:</strong> ${contactDto.email}</p>
              <p><strong>Teléfono:</strong> ${contactDto.phone || 'No proporcionado'}</p>
              <p><strong>Tipo:</strong> ${isNewProspect ? 'Nuevo prospecto' : 'Prospecto recurrente'}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>

            <div style="background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">💬 Mensaje del usuario:</h3>
              <div style="background: #f8f8f8; padding: 15px; border-left: 4px solid #FF0080; margin: 10px 0;">
                ${contactDto.message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #2E7D32;">🤖 Respuesta automática enviada:</h3>
              <div style="background: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0;">
                ${responseContent.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #856404;">⚡ Acciones recomendadas:</h4>
              <ul style="margin: 10px 0;">
                <li>Revisar el mensaje y responder personalmente si es necesario</li>
                <li>Actualizar el estado del prospecto en Firebase si corresponde</li>
                <li>Agregar notas o etiquetas según el tipo de consulta</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; text-align: center;">
              Este es un mensaje automático generado por el sistema de contacto.<br>
              No responder directamente a este email.
            </p>
          </div>
        `,
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
      const adminEmail = companyConfig.email

      return await this.mailService.sendMail({
        to: adminEmail,
        subject: `🔔 Nueva suscripción al newsletter`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #A600FF; padding-bottom: 10px;">
              🔔 Nueva suscripción al newsletter
            </h2>

            <div style="background: #f0e6ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #A600FF;">
              <h3 style="margin-top: 0; color: #333;">📧 Información del nuevo suscriptor:</h3>
              <p><strong>Email:</strong> ${subscribeDto.email}</p>
              <p><strong>Fecha de suscripción:</strong> ${new Date().toLocaleString('es-ES')}</p>
              <p><strong>User Agent:</strong> ${subscribeDto.meta.userAgent}</p>
              <p><strong>Página de origen:</strong> ${subscribeDto.meta.page}</p>
              ${subscribeDto.meta.referrer ? `<p><strong>Referrer:</strong> ${subscribeDto.meta.referrer}</p>` : ''}
            </div>

            <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #2E7D32;">✅ Acciones realizadas automáticamente:</h3>
              <ul style="margin: 10px 0;">
                <li>✅ Suscriptor guardado en base de datos</li>
                <li>✅ Email de bienvenida enviado al suscriptor</li>
                <li>✅ Notificación enviada al administrador</li>
              </ul>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #856404;">📈 Estadísticas y seguimiento:</h4>
              <p style="margin: 10px 0;">
                Este suscriptor se agregó a tu lista de newsletter. Puedes gestionar todas las suscripciones desde Firebase.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; text-align: center;">
              Este es un mensaje automático generado por el sistema de suscripciones.<br>
              No responder directamente a este email.
            </p>
          </div>
        `,
      })
    } catch (error) {
      console.error('Error enviando notificación de suscripción:', error)
      return false
    }
  }

  // Método para enviar email de bienvenida a suscriptores
  private async sendSubscriberWelcomeEmail(email: string): Promise<boolean> {
    try {
      return await this.mailService.sendMail({
        to: email,
        subject: '¡Bienvenido/a a mi newsletter! 🎉',
        templateName: 'subscriber-welcome',
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
      return await this.mailService.sendMail({
        to: email,
        subject: 'Confirmación de desuscripción - Newsletter',
        templateName: 'unsubscribe-confirmation',
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

  async testSMTPConnection() {
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

  // Obtener todos los prospectos
  async getAllProspects(): Promise<ProspectRecord[]> {
    return await this.firebaseService.getAllProspects()
  }

  // Obtener un prospecto por ID
  async getProspectById(prospectId: string): Promise<ProspectRecord | null> {
    return await this.firebaseService.getProspectById(prospectId)
  }

  // Obtener todos los suscriptores
  async getAllSubscribers(): Promise<any[]> {
    return await this.firebaseService.getAllSubscribers()
  }

  // Responder administrativamente a un prospecto
  async adminReplyToProspect(prospectId: string, replyContent: string) {
    try {
      // 1. Guardar la respuesta en Firebase como parte de la conversación
      const conversationId = await this.firebaseService.addAdminReplyToProspect(
        prospectId,
        replyContent,
      )

      // 2. Obtener los datos del prospecto para enviar el correo
      const db = this.firebaseService.getDb()
      const prospectDoc = await db.collection('prospects').doc(prospectId).get()
      if (!prospectDoc.exists) {
        throw new Error('Prospecto no encontrado al intentar enviar el correo')
      }
      const prospectData = prospectDoc.data() as ProspectRecord

      // 3. Reconstruir un ContactDto simplificado para la plantilla de correo
      const contactDto: ContactDto = {
        name: prospectData.name,
        email: prospectData.email,
        phone: prospectData.phone,
        message: 'Respuesta sobre su consulta anterior', // Placeholder referencial
        meta: {
          userAgent: 'Admin',
          page: 'AdminPanel',
          ts: new Date().toISOString(),
        },
      }

      // 4. Enviar email al prospecto (simil a sendResponseEmail pero tratándolo como recurrente)
      const emailSent = await this.sendResponseEmail(
        contactDto,
        replyContent,
        false, // Forzamos false para usar plantilla 'returning-prospect' u otra si se desea
      )

      // 5. Marcar como enviado si el correo salió exitoso
      if (emailSent) {
        await this.firebaseService.markEmailAsSent(prospectId, conversationId)
      }

      return {
        success: true,
        message: 'Respuesta enviada correctamente',
        conversationId,
        emailSent,
      }
    } catch (error) {
      console.error('Error enviando respuesta de administrador:', error)
      return {
        success: false,
        message: 'Error enviando respuesta de administrador',
        error: (error as Error).message,
      }
    }
  }

  // Double Opt-In: confirmar suscripción por token
  async verifySubscription(
    token: string,
  ): Promise<{ success: boolean; email?: string }> {
    return await this.firebaseService.confirmSubscriber(token)
  }

  // Email de confirmación para Double Opt-In
  private async sendDoubleOptInEmail(
    email: string,
    token: string,
  ): Promise<boolean> {
    try {
      const websiteUrl = companyConfig.websiteUrl
      // La URL puede ser absoluta (prod) o relativa si usas NestJS como proxy
      const confirmUrl = `${websiteUrl.replace(/\/+$/, '')}/api/forms/verify-subscription/${token}`

      const fromEmail =
        this.configService.get<string>('SMTP_FROM_EMAIL') ||
        'contacto@gabrielzavando.cl'
      const fromName = companyConfig.name

      return await this.mailService.sendMail({
        to: email,
        from: `"${fromName}" <${fromEmail}>`,
        subject: 'Confirma tu suscripción al Newsletter',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #FF0080; border-bottom: 2px solid #FF0080; padding-bottom: 10px;">
              \uD83D\uDD14 Confirma tu suscripción
            </h2>

            <p style="font-size: 1.1rem; color: #333;">\u00a1Hola!</p>
            <p style="color: #555; line-height: 1.6;">
              Recibimos una solicitud para suscribirte a nuestro newsletter.
              Haz clic en el botón de abajo para confirmar tu suscripción y empezar a recibir
              tips de transformación digital.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}"
                style="background-color: #FF0080; color: #fff; padding: 14px 32px;
                       text-decoration: none; font-weight: bold; font-size: 1rem;
                       display: inline-block;">
                Confirmar suscripción
              </a>
            </div>

            <p style="color: #999; font-size: 0.85rem;">
              Si no solicitaste esta suscripción, ignora este mensaje.
              El enlace expira en 48 horas.<br>
              O copia este enlace en tu navegador:<br>
              <a href="${confirmUrl}" style="color: #FF0080;">${confirmUrl}</a>
            </p>
          </div>
        `,
      })
    } catch (error) {
      console.error('Error enviando email de confirmación:', error)
      return false
    }
  }

  // ================================================
  // Campaña de Re-confirmación de Suscriptores
  // ================================================

  async runReconfirmationCampaign(): Promise<{
    sent: number
    skipped: number
    errors: number
    details: string[]
  }> {
    const rawSubs = await this.firebaseService.getAllSubscribers()
    const subscribers = rawSubs as Record<string, unknown>[]

    // Enviar a todos excepto a los ya confirmados
    const targets = subscribers.filter((s) => s['status'] !== 'confirmed')

    let sent = 0
    let skipped = 0
    let errors = 0
    const details: string[] = []

    for (const sub of targets) {
      const email = sub['email'] as string
      try {
        // Generar nuevo token de re-confirmación
        const subId = sub['subscriberId'] as string
        const newToken =
          await this.firebaseService.refreshReconfirmationToken(subId)

        if (!newToken) {
          skipped++
          details.push(`⚠️ ${email}: sin ID válido`)
          continue
        }

        const ok = await this.sendReconfirmationEmail(email, newToken)
        if (ok) {
          sent++
          details.push(`✅ ${email}: email enviado`)
        } else {
          errors++
          details.push(`❌ ${email}: fallo al enviar`)
        }
      } catch (err) {
        errors++
        details.push(`❌ ${email}: ${(err as Error).message}`)
      }
    }

    return { sent, skipped, errors, details }
  }

  // Email de re-confirmación (campaña de limpieza)
  private async sendReconfirmationEmail(
    email: string,
    token: string,
  ): Promise<boolean> {
    try {
      const websiteUrl = companyConfig.websiteUrl
      const confirmUrl = `${websiteUrl.replace(/\/+$/, '')}/api/forms/verify-subscription/${token}`

      const fromEmail =
        this.configService.get<string>('SMTP_FROM_EMAIL') ||
        'contacto@gabrielzavando.cl'
      const fromName = companyConfig.name

      return await this.mailService.sendMail({
        to: email,
        from: `"${fromName}" <${fromEmail}>`,
        subject: '¿Sigues interesado? Confirma tu suscripción',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;
                      margin: 0 auto; padding: 20px;">
            <h2 style="color: #FF0080; border-bottom: 2px solid #FF0080;
                       padding-bottom: 10px;">
              ¿Sigues interesado en recibir contenido de valor?
            </h2>

            <p style="font-size: 1.1rem; color: #333;">¡Hola!</p>
            <p style="color: #555; line-height: 1.6;">
              Estamos limpiando nuestra lista para enviarte solo contenido
              que realmente te interese. Haz clic en el botón de abajo para
              confirmar que sigues queriendo recibir tips de transformación
              digital en tu bandeja.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmUrl}"
                style="background-color: #FF0080; color: #fff;
                       padding: 14px 32px; text-decoration: none;
                       font-weight: bold; font-size: 1rem;
                       display: inline-block;">
                Sí, quiero seguir suscrito
              </a>
            </div>

            <p style="color: #999; font-size: 0.85rem;">
              Si no deseas seguir recibiendo emails, simplemente ignora
              este mensaje. Serás eliminado de la lista en 7 días.<br>
              O copia este enlace:<br>
              <a href="${confirmUrl}" style="color: #FF0080;">${confirmUrl}</a>
            </p>
          </div>
        `,
      })
    } catch {
      return false
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
    const rawCandidates = await this.firebaseService.getAllSubscribers()
    const subscribers = rawCandidates as Record<string, unknown>[]
    const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000

    // Candidatos: pending/active con reconfirmación enviada antes del umbral
    const candidates = subscribers.filter((s) => {
      if (s['status'] === 'confirmed') return false
      const reconfAt = s['reconfirmationSentAt']
      if (!reconfAt) return false
      const ts =
        typeof reconfAt === 'object' && '_seconds' in reconfAt
          ? (reconfAt as { _seconds: number })._seconds * 1000
          : new Date(reconfAt as string).getTime()
      return ts < cutoff
    })

    const details: string[] = []
    let marked = 0

    for (const sub of candidates) {
      const id = sub['subscriberId'] as string
      const email = sub['email'] as string
      try {
        await this.firebaseService.markSubscriberInactive(id)
        marked++
        details.push(`🗑️ ${email}: marcado como inactivo`)
      } catch {
        details.push(`⚠️ ${email}: error al marcar`)
      }
    }

    return { marked, total: subscribers.length, details }
  }

  // ================================================
  // Exportar lista de suscriptores
  // ================================================

  async exportSubscribers(): Promise<{
    count: number
    subscribers: Record<string, unknown>[]
  }> {
    const all = await this.firebaseService.getAllSubscribers()
    const clean = (all as Record<string, unknown>[]).map((s) => ({
      email: s['email'],
      status: s['status'] ?? 'active',
      createdAt: s['createdAt'],
      confirmedAt: s['confirmedAt'] ?? null,
    }))
    return { count: clean.length, subscribers: clean }
  }
}
