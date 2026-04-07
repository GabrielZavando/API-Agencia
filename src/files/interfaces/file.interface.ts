import * as admin from 'firebase-admin'

export interface RawFileRecord {
  ownerId: string
  title: string
  description: string
  fileName: string
  storagePath: string
  mimeType: string
  size: number
  isPublic: boolean
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
}

export interface RawUserRecord {
  storageLimitBytes?: number
}
