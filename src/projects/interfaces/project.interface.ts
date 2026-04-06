import * as admin from 'firebase-admin'

export interface ProjectRecord {
  clientId: string
  name: string
  description: string
  monthlyTicketLimit: number
  status: string
  percentage: number
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue
}
