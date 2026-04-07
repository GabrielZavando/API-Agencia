import * as admin from 'firebase-admin'

export interface BlogCategoryRecord {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string
  createdAt: Date | admin.firestore.Timestamp
  updatedAt: Date | admin.firestore.Timestamp
}
