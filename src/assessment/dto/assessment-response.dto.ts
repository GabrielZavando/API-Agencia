import * as admin from 'firebase-admin'

export class AssessmentResponseDto {
  id: string
  name: string
  email: string
  industry: string
  answers: boolean[]
  score: number
  level: string
  pillarScores: Record<string, number>
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}

/**
 * Resultado detallado del diagnóstico procesado por ResolverService
 */
export interface AssessmentDiagnosisResult {
  success: boolean
  diagnosis: Record<string, any>
}
