import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ClientsService {
  private usersCollection: admin.firestore.CollectionReference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.usersCollection = admin.firestore().collection('users');
  }

  async findAll(): Promise<Record<string, any>[]> {
    const query = this
      .usersCollection as admin.firestore.Query<admin.firestore.DocumentData>;
    const snapshot = await query.where('role', '==', 'client').get();
    return snapshot.docs.map((doc) => doc.data() as Record<string, any>);
  }

  async findOne(uid: string): Promise<Record<string, any> | null> {
    const doc = await this.usersCollection.doc(uid).get();
    return doc.exists ? (doc.data() as Record<string, any>) : null;
  }
  // Crear cliente (User + Role) se hace via Auth/UsersController,
  // pero aquí podríamos añadir métodos para actualizar datos de perfil de empresa
}
