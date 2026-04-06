import * as admin from 'firebase-admin'

export class TicketResponseDto {
  id: string
  clientId: string
  clientEmail: string
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'resolved'
  adminResponse: string
  projectId: string
  projectName: string
  attachmentPath?: string
  attachmentUrl?: string
  clientPhotoUrl?: string
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
  updatedAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
