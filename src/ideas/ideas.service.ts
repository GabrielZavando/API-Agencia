import { Injectable } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { CreateIdeaDto } from './dto/create-idea.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { UsersService } from '../users/users.service'
import { IdeaResponseDto } from './dto/idea-response.dto'
import { IdeaRecord } from './interfaces/idea.interface'

@Injectable()
export class IdeasService {
  private db: admin.firestore.Firestore
  private storage: admin.storage.Storage

  constructor(
    private readonly _firebase: FirebaseService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {
    this.db = this._firebase.getDb()
    this.storage = admin.storage()
  }

  private mapIdeaToDto(data: IdeaRecord): IdeaResponseDto {
    return {
      id: data.id,
      name: data.name,
      explanation: data.explanation,
      imageUrl: data.imageUrl || '',
      clientId: data.clientId,
      createdAt: data.createdAt,
    }
  }

  async createIdea(
    dto: CreateIdeaDto,
    clientId: string,
    file?: Express.Multer.File,
  ): Promise<IdeaResponseDto> {
    const docRef = this.db.collection('ideas').doc()
    let imageUrl: string | undefined

    if (file) {
      const bucket = this.storage.bucket()
      const storagePath = `ideas/${clientId}/${Date.now()}_${file.originalname}`
      const fileRef = bucket.file(storagePath)

      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      })

      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      })
      imageUrl = url
    }

    const ideaData: IdeaRecord = {
      id: docRef.id,
      name: dto.name,
      explanation: dto.explanation,
      imageUrl,
      clientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await docRef.set(ideaData)

    try {
      const admins = await this.usersService.findAdmins()
      const notificationPromises = admins.map(
        (adminUser: { id?: string; uid?: string }) =>
          this.notificationsService.create(
            adminUser.id || adminUser.uid || '',
            '💡 Nueva idea recibida',
            `El cliente ha enviado una nueva idea: "${ideaData.name}"`,
            'info',
            '/admin/ideas',
          ),
      )
      await Promise.all(notificationPromises)
    } catch (error) {
      console.error('Error enviando notificaciones a administradores:', error)
    }

    return this.mapIdeaToDto(ideaData)
  }

  async findAll(): Promise<IdeaResponseDto[]> {
    const snapshot = await this.db
      .collection('ideas')
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) =>
      this.mapIdeaToDto(doc.data() as IdeaRecord),
    )
  }

  async findByClient(clientId: string): Promise<IdeaResponseDto[]> {
    const snapshot = await this.db
      .collection('ideas')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) =>
      this.mapIdeaToDto(doc.data() as IdeaRecord),
    )
  }
}
