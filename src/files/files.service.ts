import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UploadFileDto } from './dto/upload-file.dto';
import { FirebaseService } from '../firebase/firebase.service';

export interface FileRecord {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface StorageQuota {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedFormatted: string;
  limitFormatted: string;
}

/** 5 GB default para clientes */
const DEFAULT_STORAGE_LIMIT = 5 * 1024 * 1024 * 1024;
/** 30 GB para admin */
const ADMIN_STORAGE_LIMIT = 30 * 1024 * 1024 * 1024;

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

@Injectable()
export class FilesService {
  private db: admin.firestore.Firestore;
  private storage: ReturnType<typeof admin.storage>;

  constructor(private readonly _firebase: FirebaseService) {
    this.db = admin.firestore();
    this.storage = admin.storage();
  }

  /** Cuota de almacenamiento por usuario */
  async getStorageQuota(
    uid: string,
    role: 'admin' | 'client',
  ): Promise<StorageQuota> {
    const snapshot = await this.db
      .collection('files')
      .where('ownerId', '==', uid)
      .get();

    const usedBytes = snapshot.docs.reduce((acc, doc) => {
      const d = doc.data() as FileRecord;
      return acc + (d.size || 0);
    }, 0);

    let limitBytes = ADMIN_STORAGE_LIMIT;
    if (role === 'client') {
      const userDoc = await this.db.collection('users').doc(uid).get();
      const data = userDoc.data() as Record<string, unknown> | undefined;
      limitBytes = (data?.storageLimitBytes as number) ?? DEFAULT_STORAGE_LIMIT;
    }

    return {
      usedBytes,
      limitBytes,
      remainingBytes: Math.max(0, limitBytes - usedBytes),
      usedFormatted: this.formatBytes(usedBytes),
      limitFormatted: this.formatBytes(limitBytes),
    };
  }

  /** Subir archivo */
  async uploadFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    uid: string,
    role: 'admin' | 'client',
  ): Promise<FileRecord> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    // Verificar cuota
    const quota = await this.getStorageQuota(uid, role);
    if (file.size > quota.remainingBytes) {
      throw new BadRequestException(
        `Espacio insuficiente. Disponible: ` +
          `${quota.remainingBytes > 0 ? this.formatBytes(quota.remainingBytes) : '0 B'}, ` +
          `Archivo: ${this.formatBytes(file.size)}`,
      );
    }

    const docRef = this.db.collection('files').doc();
    const storagePath = `files/${uid}/${docRef.id}_${file.originalname}`;

    const bucket = this.storage.bucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const now = new Date();
    const record: FileRecord = {
      id: docRef.id,
      ownerId: uid,
      title: dto.title || file.originalname,
      description: dto.description || '',
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
      createdAt: now,
    };

    await docRef.set(record);
    return record;
  }

  /** Listar archivos del usuario */
  async findByOwner(ownerId: string): Promise<FileRecord[]> {
    const snapshot = await this.db
      .collection('files')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as FileRecord);
  }

  /** Listar todos los archivos (admin) */
  async findAll(): Promise<FileRecord[]> {
    const snapshot = await this.db
      .collection('files')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as FileRecord);
  }

  /** Obtener URL firmada de descarga */
  async getDownloadUrl(
    fileId: string,
    uid: string,
  ): Promise<{ url: string; fileName: string }> {
    const doc = await this.db.collection('files').doc(fileId).get();

    if (!doc.exists) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const record = doc.data() as FileRecord;

    // Solo puede descargar sus archivos
    if (record.ownerId !== uid) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const bucket = this.storage.bucket();
    const fileRef = bucket.file(record.storagePath);
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
    });

    return { url, fileName: record.fileName };
  }

  /** Eliminar archivo */
  async deleteFile(fileId: string, uid: string): Promise<void> {
    const doc = await this.db.collection('files').doc(fileId).get();

    if (!doc.exists) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const record = doc.data() as FileRecord;

    if (record.ownerId !== uid) {
      throw new NotFoundException('Archivo no encontrado');
    }

    try {
      const bucket = this.storage.bucket();
      await bucket.file(record.storagePath).delete();
    } catch (error) {
      console.error('Error eliminando archivo:', error);
    }

    await this.db.collection('files').doc(fileId).delete();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(i > 1 ? 2 : 0)} ${units[i]}`;
  }
}
