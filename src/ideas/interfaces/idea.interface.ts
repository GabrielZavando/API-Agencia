import * as admin from 'firebase-admin'

export interface IdeaRecord {
  id: string
  name: string
  explanation: string
  imageUrl?: string
  clientId: string
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
}
