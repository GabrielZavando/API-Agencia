import { Injectable } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { ClientResponseDto } from './dto/client-response.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { RawUserRecord } from './interfaces/client.interface'

@Injectable()
export class ClientsService {
  private db: admin.firestore.Firestore

  constructor(private readonly firebaseService: FirebaseService) {
    this.db = this.firebaseService.getDb()
  }

  private mapDocumentToDto(
    doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
  ): ClientResponseDto {
    const data = doc.data() as RawUserRecord
    return {
      id: doc.id,
      email: data.email,
      displayName: data.displayName || data.name || '',
      photoURL: data.photoURL || '',
      role: data.role,
      phoneNumber: data.phoneNumber || '',
      companyName: data.companyName || '',
      createdAt: data.createdAt,
    }
  }

  async findAll(): Promise<ClientResponseDto[]> {
    const snapshot = await this.db
      .collection('users')
      .where('role', '==', 'client')
      .get()
    return snapshot.docs.map((doc) => this.mapDocumentToDto(doc))
  }

  async findAssignable(): Promise<ClientResponseDto[]> {
    const snapshot = await this.db
      .collection('users')
      .where('role', 'in', ['client', 'admin'])
      .get()
    return snapshot.docs.map((doc) => this.mapDocumentToDto(doc))
  }

  async findOne(uid: string): Promise<ClientResponseDto | null> {
    const doc = await this.db.collection('users').doc(uid).get()
    if (!doc.exists) return null
    return this.mapDocumentToDto(doc)
  }
}
