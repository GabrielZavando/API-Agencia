import { Injectable, NotFoundException } from '@nestjs/common'
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
  private readonly userCache = new Map<string, string>()

  constructor(
    private readonly _firebase: FirebaseService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {
    this.db = this._firebase.getDb()
    this.storage = admin.storage()
  }

  private mapIdeaToDto(data: IdeaRecord): IdeaResponseDto {
    let createdAt: string
    const rawCreatedAt = data.createdAt

    if (rawCreatedAt instanceof admin.firestore.Timestamp) {
      createdAt = rawCreatedAt.toDate().toISOString()
    } else if (rawCreatedAt instanceof Date) {
      createdAt = rawCreatedAt.toISOString()
    } else if (
      typeof rawCreatedAt === 'object' &&
      rawCreatedAt !== null &&
      '_seconds' in rawCreatedAt
    ) {
      const seconds = (rawCreatedAt as { _seconds: number })._seconds
      createdAt = new Date(seconds * 1000).toISOString()
    } else {
      createdAt = new Date().toISOString()
    }

    return {
      id: data.id,
      name: data.name,
      explanation: data.explanation,
      imageUrl: data.imageUrl || '',
      clientId: data.clientId,
      clientName:
        ((data as Record<string, any>).clientName as string | undefined) ||
        'Cargando...',
      createdAt,
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

    // Obtener el documento guardado para tener el timestamp real si es necesario
    // Aunque FieldValue.serverTimestamp() se resuelve en el servidor,
    // al hacer el set() localmente el objeto no se actualiza inmediatamente.
    const savedDoc = await docRef.get()
    const finalData = savedDoc.data() as IdeaRecord

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

    return this.mapIdeaToDto(finalData)
  }

  async findAll(): Promise<IdeaResponseDto[]> {
    const snapshot = await this.db
      .collection('ideas')
      .orderBy('createdAt', 'desc')
      .get()

    const ideas = snapshot.docs.map((doc) => {
      const docData = doc.data() as IdeaRecord
      return {
        ...docData,
        id: doc.id,
      }
    })

    // Enriquecer con nombres de clientes
    const enrichedIdeas = await Promise.all(
      ideas.map(async (idea) => {
        let clientName = this.userCache.get(idea.clientId)
        if (!clientName) {
          try {
            const user = await this.usersService.findOne(idea.clientId)
            clientName = user.displayName || user.email
            this.userCache.set(idea.clientId, clientName)
          } catch {
            clientName = 'Usuario Desconocido'
          }
        }
        const recordWithClient = { ...idea, clientName }
        return this.mapIdeaToDto(recordWithClient as unknown as IdeaRecord)
      }),
    )

    return enrichedIdeas
  }

  async findOne(id: string): Promise<IdeaResponseDto> {
    const doc = await this.db.collection('ideas').doc(id).get()
    if (!doc.exists) {
      throw new NotFoundException(`Idea con ID ${id} no encontrada`)
    }

    const data = doc.data() as IdeaRecord
    let clientName = this.userCache.get(data.clientId)
    if (!clientName) {
      try {
        const user = await this.usersService.findOne(data.clientId)
        clientName = user.displayName || user.email
        this.userCache.set(data.clientId, clientName)
      } catch {
        clientName = 'Usuario Desconocido'
      }
    }

    const recordWithClient = { ...data, id: doc.id, clientName }
    return this.mapIdeaToDto(recordWithClient as unknown as IdeaRecord)
  }

  async findByClient(clientId: string): Promise<IdeaResponseDto[]> {
    const snapshot = await this.db
      .collection('ideas')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get()

    let clientName = this.userCache.get(clientId)
    if (!clientName) {
      try {
        const user = await this.usersService.findOne(clientId)
        clientName = user.displayName || user.email
        this.userCache.set(clientId, clientName)
      } catch {
        clientName = 'Cliente'
      }
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data() as IdeaRecord
      const recordWithClient = { ...data, id: doc.id, clientName }
      return this.mapIdeaToDto(recordWithClient as unknown as IdeaRecord)
    })
  }

  async remove(id: string): Promise<void> {
    const docRef = this.db.collection('ideas').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new NotFoundException(`Idea con ID ${id} no encontrada`)
    }

    const data = doc.data() as IdeaRecord
    // Si tiene imagen en storage, borrarla
    if (data.imageUrl && data.imageUrl.includes('storage.googleapis.com')) {
      try {
        const urlParts = data.imageUrl.split('/')
        const fileName = urlParts[urlParts.length - 1].split('?')[0]
        const bucket = this.storage.bucket()
        const file = bucket.file(`ideas/${fileName}`)
        await file.delete()
      } catch (error) {
        console.error('Error al borrar imagen de la idea de storage:', error)
      }
    }

    await docRef.delete()
  }
}
