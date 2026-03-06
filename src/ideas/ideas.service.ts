import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

export interface IdeaRecord {
  id: string;
  name: string;
  explanation: string;
  imageUrl?: string;
  clientId: string;
  createdAt: Date;
}

@Injectable()
export class IdeasService {
  private db: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor(
    private readonly _firebase: FirebaseService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {
    this.db = admin.firestore();
    this.storage = admin.storage();
  }

  async createIdea(
    dto: CreateIdeaDto,
    clientId: string,
    file?: Express.Multer.File,
  ): Promise<IdeaRecord> {
    const docRef = this.db.collection('ideas').doc();
    let imageUrl: string | undefined;

    if (file) {
      const bucket = this.storage.bucket();
      const storagePath = `ideas/${clientId}/${Date.now()}_${file.originalname}`;
      const fileRef = bucket.file(storagePath);

      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      // Generar URL firmada o pública. Usaremos pública para visualización simple.
      // O firmada si prefieres privacidad total. Por ahora, firmada (1 año).
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Fecha lejana
      });
      imageUrl = url;
    }

    const idea: IdeaRecord = {
      id: docRef.id,
      name: dto.name,
      explanation: dto.explanation,
      imageUrl,
      clientId,
      createdAt: new Date(),
    };

    await docRef.set(idea);

    // Notificar a los administradores
    try {
      const admins = await this.usersService.findAdmins();
      const notificationPromises = admins.map((admin: { uid: string }) =>
        this.notificationsService.createNotification({
          title: '💡 Nueva idea recibida',
          message: `El cliente ha enviado una nueva idea: "${idea.name}"`,
          userId: admin.uid,
          link: '/admin/ideas',
          read: false,
        }),
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error enviando notificaciones a administradores:', error);
      // No bloqueamos el retorno si fallan las notificaciones
    }

    return idea;
  }

  async findAll(): Promise<IdeaRecord[]> {
    const snapshot = await this.db
      .collection('ideas')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as IdeaRecord);
  }

  async findByClient(clientId: string): Promise<IdeaRecord[]> {
    const snapshot = await this.db
      .collection('ideas')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as IdeaRecord);
  }
}
