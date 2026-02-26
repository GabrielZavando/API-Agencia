import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateReportDto } from './dto/create-report.dto';
import { FirebaseService } from '../firebase/firebase.service';

export interface ReportRecord {
  id: string;
  clientId: string;
  title: string;
  description: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

@Injectable()
export class ReportsService {
  private db: admin.firestore.Firestore;
  private storage: ReturnType<typeof admin.storage>;

  constructor(private readonly _firebase: FirebaseService) {
    this.db = admin.firestore();
    this.storage = admin.storage();
  }

  /** Admin sube un informe PDF para un cliente */
  async uploadReport(
    file: Express.Multer.File,
    dto: CreateReportDto,
  ): Promise<ReportRecord> {
    if (!file || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('El archivo debe ser un PDF válido');
    }

    const docRef = this.db.collection('reports').doc();
    const storagePath = `reports/${dto.clientId}/${docRef.id}_${file.originalname}`;

    const bucket = this.storage.bucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(file.buffer, {
      metadata: { contentType: 'application/pdf' },
    });

    const now = new Date();
    const report: ReportRecord = {
      id: docRef.id,
      clientId: dto.clientId,
      title: dto.title,
      description: dto.description || '',
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
      createdAt: now,
    };

    await docRef.set(report);
    return report;
  }

  async findByClient(clientId: string): Promise<ReportRecord[]> {
    const snapshot = await this.db
      .collection('reports')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as ReportRecord);
  }

  async findAll(): Promise<ReportRecord[]> {
    const snapshot = await this.db
      .collection('reports')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as ReportRecord);
  }

  async getDownloadUrl(
    reportId: string,
  ): Promise<{ url: string; fileName: string }> {
    const doc = await this.db.collection('reports').doc(reportId).get();

    if (!doc.exists) {
      throw new NotFoundException('Informe no encontrado');
    }

    const report = doc.data() as ReportRecord;
    const bucket = this.storage.bucket();
    const fileRef = bucket.file(report.storagePath);

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    return { url, fileName: report.fileName };
  }

  async deleteReport(reportId: string): Promise<void> {
    const doc = await this.db.collection('reports').doc(reportId).get();

    if (!doc.exists) {
      throw new NotFoundException('Informe no encontrado');
    }

    const report = doc.data() as ReportRecord;

    try {
      const bucket = this.storage.bucket();
      await bucket.file(report.storagePath).delete();
    } catch (error) {
      console.error('Error eliminando archivo de Storage:', error);
    }

    await this.db.collection('reports').doc(reportId).delete();
  }
}
