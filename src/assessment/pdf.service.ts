import { Injectable, Logger } from '@nestjs/common'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { DiagnosticoReportPdf } from '../templates/react/diagnostico-report-pdf'
import * as React from 'react'
import { PdfContext } from './interfaces/pdf-context.interface'

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name)

  async generateDiagnosisPdf(context: PdfContext): Promise<Buffer> {
    try {
      const buffer = await renderToBuffer(
        React.createElement(DiagnosticoReportPdf, {
          nombre_completo: context.nombre_completo,
          industria: context.industria,
          fecha: context.fecha,
          score: context.score,
          nivel: context.nivel,
          nivel_color: context.nivel_color,
          situacion_actual_text: context.situacion_actual_text,
          pillarScores: context.pillarScores,
        }) as unknown as React.ReactElement<DocumentProps>,
      )
      this.logger.log(
        `PDF generado con @react-pdf/renderer para ${context.nombre_completo} — Nivel ${context.nivel}`,
      )
      return Buffer.from(buffer)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido'
      this.logger.error(`Error generando PDF: ${errorMessage}`)
      throw error
    }
  }
}
