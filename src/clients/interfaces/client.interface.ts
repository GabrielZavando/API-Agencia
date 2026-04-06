import * as admin from 'firebase-admin'

export interface RawUserRecord {
  email: string
  displayName?: string
  name?: string
  photoURL?: string
  role: 'client' | 'admin'
  phoneNumber?: string
  companyName?: string
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
}
