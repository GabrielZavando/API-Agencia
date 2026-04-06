import * as admin from 'firebase-admin'

export class IdeaResponseDto {
  id: string
  name: string
  explanation: string
  imageUrl?: string
  clientId: string
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
