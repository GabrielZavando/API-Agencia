import * as admin from 'firebase-admin'

export class MessageResponseDto {
  id: string
  body: string
  senderRole: 'client' | 'admin'
  senderEmail: string
  senderPhotoUrl?: string | null
  attachmentPath?: string
  attachmentUrl?: string
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
