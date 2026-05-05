import { Injectable, Logger } from '@nestjs/common'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { PdfService } from './pdf.service'
import { ResolverService } from './resolver.service'
import { CrearDiagnosticoDto } from './dto/crear-diagnostico.dto'
import { Cron, CronExpression } from '@nestjs/schedule'
import {
  DiagnosticoLevel,
  NombrePilar,
} from './interfaces/diagnostico.interface'
import { DiagnosticoResultado } from '../templates/react/diagnostico-resultado'
import { TemplateService } from '../templates/template.service'
import * as React from 'react'
import { PdfContext } from '../assessment/interfaces/pdf-context.interface'

@Injectable()
export class DiagnosticoService {
  private readonly logger = new Logger(DiagnosticoService.name)
  private readonly DAILY_LIMIT = 20

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly pdfService: PdfService,
    private readonly resolverService: ResolverService,
    private readonly templateService: TemplateService,
  ) {}

  calculateScore(answers: boolean[]): number {
    return answers.filter(Boolean).length
  }

  getLevel(score: number): DiagnosticoLevel {
    if (score <= 5) return 'semilla'
    if (score <= 10) return 'brote'
    return 'arbol'
  }

  getPillarScores(answers: boolean[]): Record<NombrePilar, number> {
    return {
      cultura: answers.slice(0, 3).filter(Boolean).length,
      estrategia: answers.slice(3, 6).filter(Boolean).length,
      procesos: answers.slice(6, 9).filter(Boolean).length,
      datos: answers.slice(9, 12).filter(Boolean).length,
      tecnologia: answers.slice(12, 15).filter(Boolean).length,
    }
  }

  async getDailySentCount(): Promise<number> {
    const db = this.firebaseService.getDb()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    try {
      // Consultamos diagnosticos con estado='enviado' creados hoy,
      // usando collectionGroup para recorrer todas las subcolecciones 'diagnosticos'
      const snapshot = await db
        .collectionGroup('diagnosticos')
        .where('createdAt', '>=', startOfToday)
        .where('estado', '==', 'enviado')
        .count()
        .get()

      return snapshot.data().count
    } catch (error) {
      this.logger.error(
        'Error al consultar contador diario de diagnósticos enviados',
        error,
      )
      return 0
    }
  }

  // Eliminado saveAssessment ya que ahora guardamos todo en el Contacto (diagnosticos subcoleccion).

  async saveContactoAndDiagnostico(
    dto: CrearDiagnosticoDto,
    context: Record<string, any>,
    estadoEnvio: 'enviado' | 'no_enviado' = 'enviado',
  ) {
    try {
      // 1. Guardar o actualizar contacto
      const contactoId = await this.firebaseService.saveContacto({
        name: dto.name,
        email: dto.email,
        industria: dto.industry,
        origen: 'formulario_diagnostico',
      })

      // 2. Guardar diagnostico asociado
      await this.firebaseService.addDiagnosticoToContacto(contactoId, {
        respuestas: dto.answers,
        estado: estadoEnvio,
        contenido: context,
      })

      // Opcional: También podríamos registrarlo como una consulta para mantener historial de mensajes
      await this.firebaseService.addConsultaToContacto(contactoId, {
        asunto: 'Nuevo Diagnóstico Digital',
        contenido: `Ha completado el Diagnóstico Digital.\nIndustria: ${dto.industry}\nPuntaje: ${context.score}/15 - Nivel: ${context.nivel}`,
        estado: 'respondida_automaticamente',
        meta: {
          userAgent: 'Auto-Diagnóstico',
          page: '/diagnostico',
          ts: new Date().toISOString(),
        },
        respuesta: {
          fecha: new Date(),
          contenido: `Tu diagnóstico se ha procesado con éxito y tu nivel estimado es ${(context.nivel as string).toUpperCase()}.`,
          emailSent: estadoEnvio === 'enviado',
        },
      })
    } catch (error) {
      this.logger.error(
        'Error al guardar contacto asociado al diagnóstico: ' +
          (error as Error).message,
      )
    }
  }

  async sendResultEmail(
    email: string,
    context: Record<string, any>,
    pdfBuffer?: Buffer,
  ): Promise<boolean> {
    const baseVars = this.mailService.getBaseVariables(email)
    const scheduleUrl = 'https://calendly.com/gabrielzavando/30min'

    const attachments =
      pdfBuffer && pdfBuffer.length > 0
        ? [
            {
              filename: 'diagnostico-digital.pdf',
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : []

    const sent = await this.mailService.sendMail({
      to: email,
      subject: `Tu diagnóstico: Nivel ${context.nivel || context.empresa} — ${
        context.score
      }/15 puntos`,
      html: await this.templateService.renderReactTemplate(
        React.createElement(DiagnosticoResultado, {
          ...baseVars,
          nombreCompleto: context.nombre_completo as string,
          score: context.score as number,
          nivel: (context.nivel as string).toUpperCase(),
          nivelEmoji: context.nivel_emoji as string,
          situacionActualText: context.situacion_actual_text as string,
          scheduleUrl,
          websiteUrl: baseVars['websiteUrl'] as string,
          previewText: 'Tu diagnóstico digital ya está listo',
          logoUrl: baseVars['logoUrl'] as string,
          companyName: baseVars['companyName'] as string,
          address: baseVars['address'] as string,
          email: baseVars['email'] as string,
          currentYear: baseVars['currentYear'] as string,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          social: baseVars['social'] as any,
        }),
      ),
      attachments,
    })

    if (sent) {
      this.logger.log(`Email enviado con PDF a ${email}`)
    } else {
      this.logger.error(`Fallo al enviar email con PDF a ${email}`)
    }
    return sent
  }

  async processAndDeliver(
    dto: CrearDiagnosticoDto,
  ): Promise<Record<string, any>> {
    const score = this.calculateScore(dto.answers)
    const levelKey = this.getLevel(score)
    const pillarScores = this.getPillarScores(dto.answers)

    const colors: Record<DiagnosticoLevel, string> = {
      semilla: '#ef4444',
      brote: '#f59e0b',
      arbol: '#22c55e',
    }
    const color = colors[levelKey]

    const todayStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const dynamicVars = {
      nombre_completo: dto.name,
      empresa: dto.industry,
      industria: dto.industry,
      fecha: todayStr,
      id_diagnostico: Math.random().toString(36).substring(2, 11).toUpperCase(),
      score: score,
      nivel_color: color,
      nivel: levelKey,
      puntaje_cultura: pillarScores.cultura,
      puntaje_estrategia: pillarScores.estrategia,
      puntaje_procesos: pillarScores.procesos,
      puntaje_tecnologia: pillarScores.tecnologia,
      puntaje_datos: pillarScores.datos,
      version: 'v3.0',
      pillarScores,
    }

    const context = this.resolverService.resolveContext(
      levelKey,
      dto.industry,
      pillarScores,
      dynamicVars,
    )

    // Lógica Limite / Queue
    const dailyCount = await this.getDailySentCount()

    let estadoEnvio: 'enviado' | 'no_enviado' = 'enviado'
    if (dailyCount >= this.DAILY_LIMIT) {
      this.logger.warn(
        `Límite diario de ${this.DAILY_LIMIT} alcanzado (${dailyCount}). Diagnóstico será encolado.`,
      )
      estadoEnvio = 'no_enviado'
    }

    // Guardar el prospecto en CRM junto con su Diagnóstico asociado
    await this.saveContactoAndDiagnostico(dto, context, estadoEnvio)

    if (estadoEnvio === 'no_enviado') {
      return context // Terminamos temprano, se enviará después en el Cron.
    }

    try {
      this.logger.log(`Generando PDF para ${dto.email}...`)
      const pdfBuffer = await this.pdfService.generateDiagnosisPdf(
        context as unknown as PdfContext,
      )

      this.logger.log(`Enviando email con PDF a ${dto.email}...`)
      await this.sendResultEmail(dto.email, context, pdfBuffer)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      this.logger.error(`Error en el proceso asíncrono de entrega: ${errorMessage}`)
      
      // Intento de envío de rescate sin PDF
      try {
        this.logger.warn(`Intentando envío de rescate sin PDF a ${dto.email}...`)
        await this.sendResultEmail(dto.email, context, Buffer.alloc(0))
      } catch (mailErr) {
        this.logger.error(`Fallo crítico: No se pudo enviar ni el email de rescate: ${String(mailErr)}`)
      }
    }

    return context
  }

  /**
   * Procesa la cola de diagnósticos pendientes (estado='no_enviado').
   * Ejecuta a las 9 AM todos los días.
   * También puede invocarse vía un endpoint manual.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processQueue(): Promise<{
    processed: number
    skipped: number
    remainingQuota: number
  }> {
    this.logger.log(
      'Iniciando procesamiento de cola de diagnósticos programado...',
    )
    const db = this.firebaseService.getDb()

    const dailyCount = await this.getDailySentCount()
    const quota = Math.max(0, this.DAILY_LIMIT - dailyCount)

    if (quota === 0) {
      this.logger.log('Cuota diaria ya consumida. Abortando proceso de cola.')
      return { processed: 0, skipped: 0, remainingQuota: 0 }
    }

    try {
      // Consultar diagnosticos con estado 'no_enviado' en todas las subcolecciones
      const queuedSnapshot = await db
        .collectionGroup('diagnosticos')
        .where('estado', '==', 'no_enviado')
        .orderBy('createdAt', 'asc')
        .limit(quota)
        .get()

      if (queuedSnapshot.empty) {
        this.logger.log('No hay diagnósticos en cola.')
        return { processed: 0, skipped: 0, remainingQuota: quota }
      }

      let processed = 0
      for (const doc of queuedSnapshot.docs) {
        const diagnostico = doc.data() as Record<string, any>

        if (!diagnostico.contenido) {
          this.logger.error(
            `El diagnóstico en cola ${doc.id} no posee 'contenido' para compilar el PDF.`,
          )
          continue
        }

        // Obtenemos el email del contacto padre (padre del padre de esta subcolección)
        const contactoRef = doc.ref.parent.parent
        if (!contactoRef) {
          this.logger.error(
            `No se pudo obtener el contacto padre del diagnóstico ${doc.id}`,
          )
          continue
        }

        const contactoDoc = await contactoRef.get()
        if (!contactoDoc.exists) {
          this.logger.error(
            `El contacto padre del diagnóstico ${doc.id} no existe`,
          )
          continue
        }

        const contacto = contactoDoc.data() as Record<string, any>

        try {
          const pdfBuffer = await this.pdfService.generateDiagnosisPdf(
            diagnostico.contenido as unknown as PdfContext,
          )
          const sent = await this.sendResultEmail(
            contacto.email as string,
            diagnostico.contenido as Record<string, any>,
            pdfBuffer,
          )

          if (sent) {
            await doc.ref.update({ estado: 'enviado' })
            processed++
            // Pausa sutil entre envíos para evitar rate limits de SMTP
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        } catch (error) {
          this.logger.error(
            `Error procesando diagnóstico ${doc.id}: ${(error as Error).message}`,
          )
        }
      }

      this.logger.log(`Procesamiento finalizado. ${processed} enviados.`)
      return {
        processed,
        skipped: queuedSnapshot.size - processed,
        remainingQuota: quota - processed,
      }
    } catch (error) {
      this.logger.error(
        'Error general procesando cola de diagnósticos: ' +
          (error as Error).message,
      )
      throw error
    }
  }
}
