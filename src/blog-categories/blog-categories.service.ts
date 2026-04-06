import { Injectable, NotFoundException } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { FirebaseService } from '../firebase/firebase.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CategoryResponseDto } from './dto/category-response.dto'
import { BlogCategoryRecord } from './interfaces/category.interface'

@Injectable()
export class BlogCategoriesService {
  private db: admin.firestore.Firestore

  constructor(private readonly firebaseService: FirebaseService) {
    this.db = this.firebaseService.getDb()
  }

  private mapCategoryToDto(
    doc: admin.firestore.DocumentSnapshot,
  ): CategoryResponseDto {
    const data = (doc.data() || {}) as BlogCategoryRecord
    return {
      id: doc.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      color: data.color,
      icon: data.icon,
    }
  }

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { slug } = createCategoryDto
    const existing = await this.db
      .collection('categories')
      .where('slug', '==', slug)
      .get()
    if (!existing.empty) {
      throw new Error('Category slug already exists')
    }

    const docRef = this.db.collection('categories').doc()
    const now = admin.firestore.FieldValue.serverTimestamp()
    const categoryData = {
      id: docRef.id,
      ...createCategoryDto,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(categoryData)
    const saved = await docRef.get()
    return this.mapCategoryToDto(saved)
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const snapshot = await this.db
      .collection('categories')
      .orderBy('name', 'asc')
      .get()
    return snapshot.docs.map((doc) => this.mapCategoryToDto(doc))
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const doc = await this.db.collection('categories').doc(id).get()
    if (!doc.exists) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }
    return this.mapCategoryToDto(doc)
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const docRef = this.db.collection('categories').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    if (updateCategoryDto.slug) {
      const existing = await this.db
        .collection('categories')
        .where('slug', '==', updateCategoryDto.slug)
        .get()
      const otherDocsWithSameSlug = existing.docs.filter((d) => d.id !== id)
      if (otherDocsWithSameSlug.length > 0) {
        throw new Error('Category slug already exists in another category')
      }
    }

    const updateData = {
      ...updateCategoryDto,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await docRef.update(updateData)
    const updated = await docRef.get()
    return this.mapCategoryToDto(updated)
  }

  async remove(id: string): Promise<void> {
    const docRef = this.db.collection('categories').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }
    await docRef.delete()
  }
}
