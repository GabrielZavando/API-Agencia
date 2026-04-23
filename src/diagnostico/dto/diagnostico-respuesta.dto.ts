import * as admin from 'firebase-admin'

export class DiagnosticoDetalleDto {
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
export interface DiagnosticoRespuestaDto {
  success: boolean
  diagnosis: Record<string, any>
}
