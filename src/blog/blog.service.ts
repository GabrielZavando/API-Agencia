import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import * as admin from 'firebase-admin'
import { FirebaseService } from '../firebase/firebase.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { BlogPostRecord } from './interfaces/post.interface'
import { PostResponseDto } from './dto/post-response.dto'
import { PostListItemDto } from './dto/post-list-item.dto'

const CACHE_KEY_ALL_POSTS = 'blog:all_posts'
const CACHE_KEY_SLUG_PREFIX = 'blog:slug:'
const CACHE_TTL_SECONDS = 60

@Injectable()
export class BlogService {
  private collection: admin.firestore.CollectionReference

  constructor(
    private readonly firebaseService: FirebaseService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.collection = this.firebaseService.getDb().collection('posts')
  }

  private toDate(
    date: Date | admin.firestore.Timestamp | admin.firestore.FieldValue,
  ): Date {
    if (date instanceof admin.firestore.Timestamp) return date.toDate()
    return date instanceof Date ? date : new Date()
  }

  private mapPostToDto(data: BlogPostRecord): PostResponseDto {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      author: data.author,
      category: data.category,
      tags: data.tags,
      published: data.published,
      publishedAt: data.publishedAt ? this.toDate(data.publishedAt) : null,
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
    }
  }

  private mapPostToListItemDto(data: BlogPostRecord): PostListItemDto {
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      author: data.author,
      category: data.category,
      tags: data.tags,
      published: data.published,
      publishedAt: data.publishedAt ? this.toDate(data.publishedAt) : null,
      createdAt: this.toDate(data.createdAt),
    }
  }

  private async invalidateBlogCache(): Promise<void> {
    await this.cacheManager.del(CACHE_KEY_ALL_POSTS)
  }

  async create(createPostDto: CreatePostDto): Promise<PostResponseDto> {
    const { slug } = createPostDto
    const existing = await this.collection.where('slug', '==', slug).get()
    if (!existing.empty) throw new Error('Slug already exists')

    const docRef = this.collection.doc()
    const now = admin.firestore.FieldValue.serverTimestamp()
    const postData: BlogPostRecord = {
      id: docRef.id,
      title: createPostDto.title,
      slug: createPostDto.slug,
      content: createPostDto.content,
      excerpt: createPostDto.excerpt || '',
      coverImage: createPostDto.coverImage || null,
      author: createPostDto.author || null,
      category: createPostDto.category || null,
      tags: createPostDto.tags || [],
      published: createPostDto.published ?? false,
      publishedAt: createPostDto.publishedAt
        ? new Date(createPostDto.publishedAt)
        : null,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(postData)
    await this.invalidateBlogCache()
    return this.mapPostToDto(postData)
  }

  /**
   * Listado público: retorna solo los campos necesarios para las tarjetas
   * del blog, excluyendo `content` para reducir el payload.
   * Utiliza caché en memoria con TTL de 60 segundos.
   */
  async findAll(publishedOnly = false): Promise<PostListItemDto[]> {
    const cached =
      await this.cacheManager.get<PostListItemDto[]>(CACHE_KEY_ALL_POSTS)
    if (cached) return cached

    // Índice compuesto requerido: published ASC + createdAt DESC
    let query: admin.firestore.Query = this.collection.orderBy(
      'createdAt',
      'desc',
    )

    if (publishedOnly) {
      query = query.where('published', '==', true)
    }

    // Proyección: excluye `content` del payload
    const projection = query.select(
      'id',
      'title',
      'slug',
      'excerpt',
      'coverImage',
      'author',
      'category',
      'tags',
      'published',
      'publishedAt',
      'createdAt',
    )

    const snapshot = await projection.get()
    const posts = snapshot.docs.map((doc) =>
      this.mapPostToListItemDto(doc.data() as BlogPostRecord),
    )

    await this.cacheManager.set(
      CACHE_KEY_ALL_POSTS,
      posts,
      CACHE_TTL_SECONDS * 1000,
    )

    return posts
  }

  async findOne(id: string): Promise<PostResponseDto> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) throw new NotFoundException(`Post with ID ${id} not found`)
    return this.mapPostToDto(doc.data() as BlogPostRecord)
  }

  async findBySlug(slug: string): Promise<PostResponseDto> {
    const cacheKey = `${CACHE_KEY_SLUG_PREFIX}${slug}`
    const cached = await this.cacheManager.get<PostResponseDto>(cacheKey)
    if (cached) return cached

    const snapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get()

    if (snapshot.empty)
      throw new NotFoundException(`Post with slug ${slug} not found`)

    const post = this.mapPostToDto(snapshot.docs[0].data() as BlogPostRecord)

    await this.cacheManager.set(cacheKey, post, CACHE_TTL_SECONDS * 1000)

    return post
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const docRef = this.collection.doc(id)
    const doc = await docRef.get()
    if (!doc.exists) throw new NotFoundException(`Post with ID ${id} not found`)

    const updateData: admin.firestore.UpdateData<BlogPostRecord> = {
      ...updatePostDto,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (updatePostDto.publishedAt !== undefined) {
      const pubAt = updatePostDto.publishedAt
      updateData.publishedAt = pubAt ? new Date(pubAt) : null
    }

    await docRef.update(updateData)

    // Invalidar caché del listado y del slug
    const currentSlug = (doc.data() as BlogPostRecord).slug
    await Promise.all([
      this.invalidateBlogCache(),
      this.cacheManager.del(`${CACHE_KEY_SLUG_PREFIX}${currentSlug}`),
    ])

    const updated = await docRef.get()
    return this.mapPostToDto(updated.data() as BlogPostRecord)
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    // Obtener el slug antes de eliminar para invalidar su caché
    const doc = await this.collection.doc(id).get()
    if (doc.exists) {
      const slug = (doc.data() as BlogPostRecord).slug
      await Promise.all([
        this.collection.doc(id).delete(),
        this.invalidateBlogCache(),
        this.cacheManager.del(`${CACHE_KEY_SLUG_PREFIX}${slug}`),
      ])
    } else {
      await this.collection.doc(id).delete()
    }

    return { id, deleted: true }
  }
}
