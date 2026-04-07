import * as admin from 'firebase-admin'

export class ReportResponseDto {
  id: string
  clientId: string
  title: string
  description: string
  fileName: string
  storagePath: string
  mimeType: string
  size: number
  projectId?: string
  projectName?: string
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
