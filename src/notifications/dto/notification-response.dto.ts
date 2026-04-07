import * as admin from 'firebase-admin'

export class NotificationResponseDto {
  id: string
  userId: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
