import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateReportDto } from './dto/create-report.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

export interface ReportRecord {
  id: string;
  clientId: string;
  title: string;
  description: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  projectId?: string;
  projectName?: string;
  createdAt: Date;
}

@Injectable()
export class ReportsService {
  private db: admin.firestore.Firestore;
  private storage: ReturnType<typeof admin.storage>;

  constructor(
    private readonly _firebase: FirebaseService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {
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
      projectId: dto.projectId,
      projectName: dto.projectName,
      createdAt: now,
    };

    await docRef.set(report);

    // 1. Crear notificación en el dashboard
    try {
      await this.notificationsService.createNotification({
        userId: dto.clientId,
        title: 'Nuevo Informe Recibido',
        message: `Has recibido el informe: ${dto.title}${dto.projectName ? ` para el proyecto ${dto.projectName}` : ''}.`,
        link: '/dashboard/informes',
        read: false,
      });
    } catch (error) {
      console.error('Error creando notificación de informe:', error);
    }

    // 2. Enviar correo con el PDF adjunto
    try {
      const user = (await this.usersService.findOne(dto.clientId)) as {
        email: string;
        displayName?: string;
      };
      if (user && user.email) {
        await this.mailService.sendMail({
          to: user.email,
          from: 'soporte@gabrielzavando.cl',
          subject: `Nuevo Informe: ${dto.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #FF0080; border-bottom: 2px solid #FF0080; padding-bottom: 10px;">Nuevo Informe Disponible</h2>
              <p>Hola <strong>${user.displayName || 'Cliente'}</strong>,</p>
              <p>Se ha subido un nuevo informe a tu panel de control.</p>
              <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #FF0080;">
                <p style="margin: 0;"><strong>Título:</strong> ${dto.title}</p>
                ${dto.projectName ? `<p style="margin: 5px 0 0 0;"><strong>Proyecto:</strong> ${dto.projectName}</p>` : ''}
                ${dto.description ? `<p style="margin: 5px 0 0 0;"><strong>Descripción:</strong> ${dto.description}</p>` : ''}
              </div>
              <p>Adjunto a este correo encontrarás una copia del informe en formato PDF.</p>
              <p>También puedes verlo y descargarlo en cualquier momento desde tu dashboard:</p>
              <a href="https://gabrielzavando.cl/dashboard/informes" style="display: inline-block; background: #FF0080; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Ver en el Dashboard</a>
              <p style="margin-top: 30px; font-size: 13px; color: #777;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
          `,
          attachments: [
            {
              filename: file.originalname,
              content: file.buffer,
              contentType: 'application/pdf',
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error enviando correo de informe:', error);
    }

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
    user: { uid: string; role?: string },
  ): Promise<{ url: string; fileName: string }> {
    const doc = await this.db.collection('reports').doc(reportId).get();

    if (!doc.exists) {
      throw new NotFoundException('Informe no encontrado');
    }

    const report = doc.data() as ReportRecord;

    // Verificación de propiedad (solo para clientes)
    if (user.role !== 'admin' && report.clientId !== user.uid) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este informe',
      );
    }

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
