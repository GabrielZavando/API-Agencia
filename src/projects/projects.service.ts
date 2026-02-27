import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FirebaseService } from '../firebase/firebase.service';

export interface ProjectRecord {
  id: string;
  clientId: string;
  name: string;
  description: string;
  monthlyTicketLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProjectsService {
  private db: admin.firestore.Firestore;

  constructor(private readonly _firebase: FirebaseService) {
    this.db = admin.firestore();
  }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectRecord> {
    if (!createProjectDto.clientId) {
      throw new BadRequestException('El ID del cliente es requerido');
    }
    if (!createProjectDto.name) {
      throw new BadRequestException('El nombre del proyecto es requerido');
    }

    const docRef = this.db.collection('projects').doc();
    const now = new Date();

    const project: ProjectRecord = {
      id: docRef.id,
      clientId: createProjectDto.clientId,
      name: createProjectDto.name,
      description: createProjectDto.description || '',
      monthlyTicketLimit: createProjectDto.monthlyTicketLimit || 10,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(project);
    return project;
  }

  async findAllByClient(clientId: string): Promise<ProjectRecord[]> {
    const snapshot = await this.db
      .collection('projects')
      .where('clientId', '==', clientId)
      .get();

    const projects = snapshot.docs.map((doc) => doc.data() as ProjectRecord);
    return projects.sort((a, b) => {
      const timeA = (a.createdAt as unknown as admin.firestore.Timestamp).toMillis
        ? (a.createdAt as unknown as admin.firestore.Timestamp).toMillis()
        : new Date(a.createdAt).getTime();
        
      const timeB = (b.createdAt as unknown as admin.firestore.Timestamp).toMillis
        ? (b.createdAt as unknown as admin.firestore.Timestamp).toMillis()
        : new Date(b.createdAt).getTime();
        
      return timeB - timeA;
    });
  }

  async findOne(id: string): Promise<ProjectRecord> {
    const doc = await this.db.collection('projects').doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return doc.data() as ProjectRecord;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectRecord> {
    const docRef = this.db.collection('projects').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const updateData = {
      ...updateProjectDto,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return updatedDoc.data() as ProjectRecord;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const docRef = this.db.collection('projects').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    await docRef.delete();
    return { success: true };
  }
}
