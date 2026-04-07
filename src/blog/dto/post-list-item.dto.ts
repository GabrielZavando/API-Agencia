export class PostListItemDto {
  id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: string | null
  author?: string | null
  category?: string | null
  tags?: string[]
  published: boolean
  publishedAt?: Date | string | null
  createdAt: Date | string | number
}
