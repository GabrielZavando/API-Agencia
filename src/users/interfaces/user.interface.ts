import * as admin from 'firebase-admin'

export interface UserRecord {
  uid: string
  id: string
  email: string
  displayName: string
  photoURL?: string
  role: string
  storageLimitBytes?: number
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue
  updatedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue
}

export interface UserUpdates {
  displayName?: string
  phone?: string
  description?: string
  email?: string
  password?: string
  role?: string
  storageLimitBytes?: number
  photoURL?: string
  updatedAt: admin.firestore.FieldValue
}
