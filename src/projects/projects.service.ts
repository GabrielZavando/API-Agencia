import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { Project } from '../common/interfaces';

@Injectable()
export class ProjectsService {
  private collection: admin.firestore.CollectionReference;

  constructor(private readonly firebaseService: FirebaseService) {
    this.collection = admin.firestore().collection('projects');
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const docRef = this.collection.doc();
    const project: Project = {
      id: docRef.id,
      clientId: createProjectDto.clientId,
      title: createProjectDto.title,
      description: createProjectDto.description,
      status: createProjectDto.status || 'pending',
      files: createProjectDto.files || [],
      reports: createProjectDto.reports || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await docRef.set(project);
    return project;
  }

  async findAll(): Promise<Project[]> {
    const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as Project);
  }

  async findByClient(clientId: string): Promise<Project[]> {
    const snapshot = await this.collection
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => doc.data() as Project);
  }

  async findOne(id: string): Promise<Project> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return doc.data() as Project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const updateData = {
      ...updateProjectDto,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as Project;
  }

  async remove(id: string): Promise<{ id: string; deleted: boolean }> {
    await this.collection.doc(id).delete();
    return { id, deleted: true };
  }
}
