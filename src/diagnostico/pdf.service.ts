import { Injectable, Logger } from '@nestjs/common'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { DiagnosticoReportPdf } from '../templates/react/diagnostico-report-pdf'
import * as React from 'react'
import { PdfContext } from './interfaces/diagnostico.interface'

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name)

  async generateDiagnosisPdf(context: PdfContext): Promise<Buffer> {
    try {
      const buffer = await renderToBuffer(
        React.createElement(DiagnosticoReportPdf, {
          ...context,
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
