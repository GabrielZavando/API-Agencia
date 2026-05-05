export interface PillarScores {
  personas: number
  procesos: number
  tecnologia: number
  datos: number
}

export interface PdfContext {
  nombre_completo: string
  industria: string
  fecha: string
  score: number
  nivel: string
  nivel_color: string
  situacion_actual_text?: string
  pillarScores: PillarScores
}
