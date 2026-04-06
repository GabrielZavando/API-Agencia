import * as admin from 'firebase-admin'

export type AssessmentLevel = 'semilla' | 'brote' | 'arbol'
export type PillarName = 'personas' | 'procesos' | 'tecnologia' | 'datos'

export interface PillarScore {
  personas: number
  procesos: number
  tecnologia: number
  datos: number
}

export interface AssessmentRecord {
  id: string
  name: string
  email: string
  industry: string
  answers: boolean[]
  score: number
  level: string
  pillarScores: Record<string, number>
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
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
