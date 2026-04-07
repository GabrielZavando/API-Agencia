import * as admin from 'firebase-admin'

export class ClientResponseDto {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  role?: 'client' | 'admin'
  phoneNumber?: string
  companyName?: string
  createdAt?:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
