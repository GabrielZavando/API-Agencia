import * as admin from 'firebase-admin'

export class ProspectResponseDto {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  status: string
  conversations: any[]
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

export class SubscriberResponseDto {
  id: string
  email: string
  status:
    | 'pending'
    | 'sent'
    | 'confirmed'
    | 'unconfirmed'
    | 'inactive'
    | 'unsubscribed'
  subscribedAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
  confirmedAt?:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
    | null
  meta?: {
    page?: string
    referrer?: string | null
    userAgent?: string
  }
}
