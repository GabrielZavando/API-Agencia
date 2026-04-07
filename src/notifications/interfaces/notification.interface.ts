import * as admin from 'firebase-admin'

export interface NotificationRecord {
  id?: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'project' | 'ticket'
  read: boolean
  link?: string
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
}
