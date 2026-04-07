import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import * as admin from 'firebase-admin'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectResponseDto } from './dto/project-response.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { ProjectRecord } from './interfaces/project.interface'

@Injectable()
export class ProjectsService {
  private db: admin.firestore.Firestore

  constructor(private readonly _firebase: FirebaseService) {
    this.db = this._firebase.getDb()
  }

  private mapDocumentToDto(
    doc: admin.firestore.DocumentSnapshot<ProjectRecord>,
  ): ProjectResponseDto {
    const data = doc.data()
    if (!data) throw new NotFoundException('Datos del proyecto no encontrados')

    return {
      id: doc.id,
      clientId: data.clientId,
      name: data.name,
      description: data.description || '',
      monthlyTicketLimit: data.monthlyTicketLimit || 3,
      status: data.status,
      percentage: data.percentage,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    if (!createProjectDto.clientId) {
      throw new BadRequestException('El ID del cliente es requerido')
    }
    if (!createProjectDto.name) {
      throw new BadRequestException('El nombre del proyecto es requerido')
    }

    const docRef = this.db.collection('projects').doc()
    const now = admin.firestore.FieldValue.serverTimestamp()

    const projectData: ProjectRecord = {
      clientId: createProjectDto.clientId,
      name: createProjectDto.name,
      description: createProjectDto.description || '',
      monthlyTicketLimit: createProjectDto.monthlyTicketLimit || 3,
      status: createProjectDto.status || 'active',
      percentage: createProjectDto.percentage || 0,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(projectData)
    const savedDoc =
      (await docRef.get()) as admin.firestore.DocumentSnapshot<ProjectRecord>
    return this.mapDocumentToDto(savedDoc)
  }

  private getMillis(date: unknown): number {
    if (!date) return 0
    if (date instanceof Date) return date.getTime()

    const d = date as Record<string, unknown>
    if (typeof d.toMillis === 'function') {
      return (d.toMillis as () => number)()
    }
    if (typeof d.seconds === 'number') {
      return d.seconds * 1000
    }
    if (typeof date === 'string' || typeof date === 'number') {
      const val = new Date(date).getTime()
      return isNaN(val) ? 0 : val
    }
    return 0
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    const snapshot = (await this.db
      .collection('projects')
      .get()) as admin.firestore.QuerySnapshot<ProjectRecord>
    const projects = snapshot.docs.map((doc) => this.mapDocumentToDto(doc))
    return projects.sort((a, b) => {
      const timeA = this.getMillis(a.createdAt)
      const timeB = this.getMillis(b.createdAt)
      return timeB - timeA
    })
  }

  async findAllByClient(clientId: string): Promise<ProjectResponseDto[]> {
    const snapshot = (await this.db
      .collection('projects')
      .where('clientId', '==', clientId)
      .get()) as admin.firestore.QuerySnapshot<ProjectRecord>

    const projects = snapshot.docs.map((doc) => this.mapDocumentToDto(doc))
    return projects.sort((a, b) => {
      const timeA = this.getMillis(a.createdAt)
      const timeB = this.getMillis(b.createdAt)
      return timeB - timeA
    })
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const doc = (await this.db
      .collection('projects')
      .doc(id)
      .get()) as admin.firestore.DocumentSnapshot<ProjectRecord>
    if (!doc.exists) {
      throw new NotFoundException('Proyecto no encontrado')
    }
    return this.mapDocumentToDto(doc)
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const docRef = this.db.collection('projects').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      throw new NotFoundException('Proyecto no encontrado')
    }

    const updateData: Record<string, any> = {
      ...updateProjectDto,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    await docRef.update(updateData)
    const updatedDoc =
      (await docRef.get()) as admin.firestore.DocumentSnapshot<ProjectRecord>
    return this.mapDocumentToDto(updatedDoc)
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const docRef = this.db.collection('projects').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new NotFoundException('Proyecto no encontrado')
    }
    await docRef.delete()
    return { success: true }
  }
}
