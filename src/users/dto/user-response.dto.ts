import * as admin from 'firebase-admin'

export class UserResponseDto {
  id: string
  email: string
  displayName: string
  photoURL: string
  role: string
  storageLimitBytes?: number
  createdAt?:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
  updatedAt?:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
