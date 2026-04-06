import * as admin from 'firebase-admin'

export class PostResponseDto {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string | null
  author?: string | null
  category?: string | null
  tags?: string[]
  published: boolean
  publishedAt?:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | null
  createdAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
  updatedAt:
    | admin.firestore.Timestamp
    | admin.firestore.FieldValue
    | Date
    | string
    | number
}
