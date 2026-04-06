import * as admin from 'firebase-admin'

export class ProjectResponseDto {
  id: string
  clientId: string
  name: string
  description: string
  monthlyTicketLimit: number
  status?: string
  percentage?: number
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | string
    | number
  updatedAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | string
    | number
}
