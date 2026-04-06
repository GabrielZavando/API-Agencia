import { Injectable, Logger } from '@nestjs/common'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { PdfService } from './pdf.service'
import { ResolverService } from './resolver.service'
import { CreateAssessmentDto } from './dto/create-assessment.dto'
import { AssessmentResponseDto } from './dto/assessment-response.dto'
import * as admin from 'firebase-admin'
import {
  AssessmentLevel,
  AssessmentRecord,
  PillarName,
} from './interfaces/assessment.interface'

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name)

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly pdfService: PdfService,
    private readonly resolverService: ResolverService,
  ) {}

  private mapAssessmentToDto(
    doc: admin.firestore.DocumentSnapshot,
  ): AssessmentResponseDto {
    const data = doc.data() as AssessmentRecord
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      industry: data.industry,
      answers: data.answers,
      score: data.score,
      level: data.level,
      pillarScores: data.pillarScores,
      createdAt: data.createdAt,
    }
  }

  calculateScore(answers: boolean[]): number {
    return answers.filter(Boolean).length
  }

  getLevel(score: number): AssessmentLevel {
    if (score <= 4) return 'semilla'
    if (score <= 8) return 'brote'
    return 'arbol'
  }

  getPillarScores(answers: boolean[]): Record<PillarName, number> {
    return {
      personas: answers.slice(0, 3).filter(Boolean).length,
      procesos: answers.slice(3, 6).filter(Boolean).length,
      tecnologia: answers.slice(6, 9).filter(Boolean).length,
      datos: answers.slice(9, 12).filter(Boolean).length,
    }
  }

  async saveAssessment(
    dto: CreateAssessmentDto,
    context: Record<string, any>,
  ): Promise<AssessmentResponseDto> {
    const db = this.firebaseService.getDb()
    const docRef = db.collection('assessments').doc()

    const assessmentData: Omit<AssessmentRecord, 'id'> = {
      name: dto.name,
      email: dto.email,
      industry: dto.industry,
      answers: dto.answers,
      score: context.score as number,
      level: context.nivel as string,
      pillarScores: context.pillarScores as Record<string, number>,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await docRef.set(assessmentData)

    this.logger.log(
      `Assessment guardado — id: ${docRef.id}, nivel: ${context.nivel}, score: ${context.score}`,
    )
    const saved = await docRef.get()
    return this.mapAssessmentToDto(saved)
  }

  async sendResultEmail(
    dto: CreateAssessmentDto,
    context: Record<string, any>,
    pdfBuffer?: Buffer,
  ): Promise<boolean> {
    const baseVars = await this.mailService.getBaseVariables(dto.email)
    const scheduleUrl = 'https://calendar.app.google/HbTU9z3qgBWTUzkK7'

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
      to: dto.email,
      subject: `Tu diagnóstico: Nivel ${context.nivel || dto.industry} — ${
        context.score
      }/12 puntos`,
      templateName: 'assessment-result',
      templateVariables: {
        ...baseVars,
        nombre_completo: context.nombre_completo as string,
        score: context.score as number,
        nivel: context.nivel as string,
        nivel_emoji: context.nivel_emoji as string,
        situacion_actual_text: context.situacion_actual_text as string,
        scheduleUrl,
      },
      attachments,
    })

    if (sent) {
      this.logger.log(`Email enviado a ${dto.email}`)
    } else {
      this.logger.error(`Fallo al enviar email a ${dto.email}`)
    }
    return sent
  }

  async processAndDeliver(
    dto: CreateAssessmentDto,
  ): Promise<Record<string, any>> {
    const score = this.calculateScore(dto.answers)
    const levelKey = this.getLevel(score)
    const pillarScores = this.getPillarScores(dto.answers)

    const colors: Record<AssessmentLevel, string> = {
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
      puntaje_personas: pillarScores.personas,
      puntaje_procesos: pillarScores.procesos,
      puntaje_tecnologia: pillarScores.tecnologia,
      puntaje_datos: pillarScores.datos,
      version: 'v2.0',
      pillarScores,
    }

    const context = this.resolverService.resolveContext(
      levelKey,
      dto.industry,
      pillarScores,
      dynamicVars,
    )

    await this.saveAssessment(dto, context)

    this.pdfService
      .generateDiagnosisPdf(context)
      .then((pdfBuffer) => {
        this.sendResultEmail(dto, context, pdfBuffer).catch((err: Error) =>
          this.logger.error('Error al enviar email con PDF: ' + err.message),
        )
      })
      .catch((err: Error) => {
        this.logger.warn(
          `PDF no disponible: ${err.message}. Enviando email sin adjunto.`,
        )
        this.sendResultEmail(dto, context, Buffer.alloc(0)).catch(
          (mailErr: Error) =>
            this.logger.error(
              'Error al enviar email sin PDF: ' + mailErr.message,
            ),
        )
      })

    return context
  }
}
