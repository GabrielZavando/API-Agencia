import * as admin from 'firebase-admin'

export type DiagnosticoLevel = 'semilla' | 'brote' | 'arbol'
export type NombrePilar =
  | 'cultura'
  | 'estrategia'
  | 'procesos'
  | 'tecnologia'
  | 'datos'

export interface PillarScore {
  cultura: number
  estrategia: number
  procesos: number
  tecnologia: number
  datos: number
}

export interface PillarBadge {
  label: string
  class: string
}

export interface PdfContext {
  nombre_completo: string
  empresa: string
  industria: string
  fecha: string
  id_diagnostico: string
  score: number
  nivel: string
  nivel_label: string
  nivel_class: string
  nivel_color: string
  pillarScores: PillarScore
  situacion_actual_text: string
  mensaje_clave_text: string
  impacto_industria_text: string
  riesgos: Array<{ titulo: string; consecuencia: string }>
  pilar_critico: string
  pilar_critico_descripcion: string
  plan_de_accion: any[]
  resumen_foco_critico: string
  badge_cultura: PillarBadge
  badge_estrategia: PillarBadge
  badge_procesos: PillarBadge
  badge_datos: PillarBadge
  badge_tecnologia: PillarBadge
  plan_de_accion_top3: Array<{
    titulo: string
    descripcion_breve: string
  }>
  foco_critico_text: string
  consultor_nombre: string
  sector_label: string
  year: string
  [key: string]: any
}

/**
 * Representa el registro de un diagnóstico procesado.
 * Nota: La persistencia real ahora ocurre mediante la subcolección en Contactos.
 */
export interface DiagnosticoInternalRecord {
  id: string
  name: string
  email: string
  industry: string
  answers: boolean[]
  score: number
  level: string
  pillarScores: Record<string, number>
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
  status?: 'queued' | 'sent'
  context?: Record<string, any>
}

export interface PillarFeedback {
  title: string
  score: number
  maxScore: number
  status: 'Crítico' | 'En Desarrollo' | 'Avanzado'
  status_color: string
  description: string
  recomendaciones: string[]
}
