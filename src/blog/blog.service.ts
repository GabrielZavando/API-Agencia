import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class BlogService {
  private collection: admin.firestore.CollectionReference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.collection = admin.firestore().collection('posts');
  }

  async create(createPostDto: CreatePostDto) {
    const { slug } = createPostDto;
    // Verificar si el slug ya existe
    const existing = await this.collection.where('slug', '==', slug).get();
    if (!existing.empty) {
      throw new Error('Slug already exists');
    }

    const docRef = this.collection.doc();
    const post = {
      id: docRef.id,
      ...createPostDto,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      published: createPostDto.published ?? false,
      publishedAt: createPostDto.publishedAt ? new Date(createPostDto.publishedAt) : null,
      coverImage: createPostDto.coverImage || null,
      author: createPostDto.author || null,
      category: createPostDto.category || null,
    };

    await docRef.set(post);
    return post;
  }

  async findAll(publishedOnly = false) {
    const query: admin.firestore.Query = this.collection.orderBy(
      'createdAt',
      'desc',
    );

    const snapshot = await query.get();
    let docs = snapshot.docs.map((doc) => doc.data());

    if (publishedOnly) {
      docs = docs.filter((doc: any) => doc.published === true);
    }

    return docs;
  }

  async findOne(id: string) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return doc.data();
  }

  async findBySlug(slug: string) {
    const snapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get();
    if (snapshot.empty) {
      throw new NotFoundException(`Post with slug ${slug} not found`);
    }
    return snapshot.docs[0].data();
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const updateData: any = {
      ...updatePostDto,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (updatePostDto.publishedAt !== undefined) {
      updateData.publishedAt = updatePostDto.publishedAt ? new Date(updatePostDto.publishedAt) : null;
    }
    
    await docRef.update(updateData);
    return { id, ...updateData };
  }

  async remove(id: string) {
    await this.collection.doc(id).delete();
    return { id, deleted: true };
  }
}
