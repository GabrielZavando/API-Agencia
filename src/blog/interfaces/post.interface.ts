import * as admin from 'firebase-admin'

export interface BlogPostRecord {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  coverImage: string | null
  author: string | null
  category: string | null
  tags: string[]
  published: boolean
  publishedAt: Date | admin.firestore.Timestamp | null
  createdAt: Date | admin.firestore.Timestamp | admin.firestore.FieldValue
  updatedAt: Date | admin.firestore.Timestamp | admin.firestore.FieldValue
}
