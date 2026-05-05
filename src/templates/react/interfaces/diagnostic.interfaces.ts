import { EmailLayoutProps } from './email.interfaces'

export interface DiagnosticoResultadoProps extends EmailLayoutProps {
  nombreCompleto: string
  score: number
  nivel: string
  nivelEmoji: string
  situacionActualText: string
  scheduleUrl: string
  websiteUrl: string
}

import { PdfContext } from '../../../assessment/interfaces/pdf-context.interface'

export type DiagnosticoReportPdfProps = PdfContext

export interface ReportDeliveryProps extends EmailLayoutProps {
  clientName: string
  reportTitle: string
  reportProject: string
  reportDescription: string
  websiteUrl: string
}
