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

export interface DiagnosticoReportPdfProps {
  nombre_completo: string
  industria: string
  fecha: string
  score: number
  nivel: string
  nivel_color: string
  situacion_actual_text?: string
  pillarScores: {
    personas: number
    procesos: number
    tecnologia: number
    datos: number
  }
}

export interface ReportDeliveryProps extends EmailLayoutProps {
  clientName: string
  reportTitle: string
  reportProject: string
  reportDescription: string
  websiteUrl: string
}
