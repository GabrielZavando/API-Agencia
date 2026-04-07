import * as admin from 'firebase-admin'

export class FileResponseDto {
  id: string
  ownerId: string
  title: string
  description: string
  fileName: string
  storagePath: string
  mimeType: string
  size: number
  isPublic: boolean
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}

export class StorageQuotaDto {
  usedBytes: number
  limitBytes: number
  remainingBytes: number
  usedFormatted: string
  limitFormatted: string
}

export class FileUploadResponseDto {
  success: boolean
  message: string
  file?: FileResponseDto
}
