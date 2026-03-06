import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  userId: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  private db: admin.firestore.Firestore;

  constructor(private readonly _firebase: FirebaseService) {
    this.db = admin.firestore();
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationRecord> {
    const docRef = this.db.collection('notifications').doc();
    const now = new Date();

    const notification: NotificationRecord = {
      id: docRef.id,
      title: dto.title,
      message: dto.message,
      userId: dto.userId,
      link: dto.link,
      read: dto.read || false,
      createdAt: now,
    };

    await docRef.set(notification);
    return notification;
  }

  async getUserNotifications(userId: string): Promise<NotificationRecord[]> {
    const snapshot = await this.db
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => doc.data() as NotificationRecord);
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationRecord> {
    const docRef = this.db.collection('notifications').doc(notificationId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Notificación no encontrada');
    }

    const data = doc.data() as NotificationRecord;

    if (data.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    await docRef.update({ read: true });

    return { ...data, read: true };
  }
}
