import { Injectable, NotFoundException } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { FirebaseService } from '../firebase/firebase.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class BlogCategoriesService {
  private collection: admin.firestore.CollectionReference

  constructor(private readonly firebaseService: FirebaseService) {
    this.collection = admin.firestore().collection('categories')
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { slug } = createCategoryDto
    // Verify if slug exists
    const existing = await this.collection.where('slug', '==', slug).get()
    if (!existing.empty) {
      throw new Error('Category slug already exists')
    }

    const docRef = this.collection.doc()
    const category = {
      id: docRef.id,
      ...createCategoryDto,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await docRef.set(category)
    return category
  }

  async findAll() {
    const query = this.collection.orderBy('name', 'asc')
    const snapshot = await query.get()
    return snapshot.docs.map((doc) => doc.data())
  }

  async findOne(id: string) {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }
    return doc.data()
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const docRef = this.collection.doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new NotFoundException(`Category with ID ${id} not found`)
    }

    const updateData: Record<string, unknown> = {
      ...(updateCategoryDto as Record<string, unknown>),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (updateCategoryDto.slug) {
      const existing = await this.collection
        .where('slug', '==', updateCategoryDto.slug)
        .get()
      const otherDocsWithSameSlug = existing.docs.filter((d) => d.id !== id)
      if (otherDocsWithSameSlug.length > 0) {
        throw new Error('Category slug already exists in another category')
      }
    }

    await docRef.update(updateData)
    return { id, ...updateData }
  }

  async remove(id: string) {
    await this.collection.doc(id).delete()
    return { id, deleted: true }
  }
}
