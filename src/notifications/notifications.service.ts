import { Injectable, NotFoundException } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { FirebaseService } from '../firebase/firebase.service'
import { NotificationRecord } from './interfaces/notification.interface'

@Injectable()
export class NotificationsService {
  private collection: admin.firestore.CollectionReference<NotificationRecord>

  constructor(private readonly firebaseService: FirebaseService) {
    this.collection = this.firebaseService
      .getDb()
      .collection(
        'notifications',
      ) as admin.firestore.CollectionReference<NotificationRecord>
  }

  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationRecord['type'] = 'info',
    link?: string,
  ): Promise<NotificationRecord> {
    const notification: NotificationRecord = {
      userId,
      title,
      message,
      type,
      read: false,
      link,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    const docRef = await this.collection.add(notification)
    return { ...notification, id: docRef.id }
  }

  async findAllByUser(userId: string): Promise<NotificationRecord[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async markAsRead(id: string): Promise<{ success: boolean }> {
    const docRef = this.collection.doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw new NotFoundException('Notificación no encontrada')
    }

    await docRef.update({ read: true } as Partial<NotificationRecord>)
    return { success: true }
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get()

    const batch = this.firebaseService.getDb().batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true } as Partial<NotificationRecord>)
    })

    await batch.commit()
    return { count: snapshot.size }
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.collection.doc(id).delete()
    return { success: true }
  }
}
