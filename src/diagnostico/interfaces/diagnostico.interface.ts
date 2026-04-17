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
