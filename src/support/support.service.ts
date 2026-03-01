import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';

export interface TicketRecord {
  id: string;
  clientId: string;
  clientEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  adminResponse: string;
  projectId: string;
  projectName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketQuota {
  used: number;
  limit: number;
  remaining: number;
}

const DEFAULT_MONTHLY_LIMIT = 2;

@Injectable()
export class SupportService {
  private db: admin.firestore.Firestore;

  // Inyectar FirebaseService garantiza que Firebase
  // esté inicializado antes de usarlo
  constructor(
    private readonly _firebase: FirebaseService,
    private readonly mailService: MailService,
  ) {
    this.db = admin.firestore();
  }

  async getTicketQuota(projectId: string): Promise<TicketQuota> {
    // Obtener límite del proyecto
    const projectDoc = await this.db
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const projectData = projectDoc.data() as Record<string, unknown>;
    const limit =
      (projectData?.monthlyTicketLimit as number) ?? DEFAULT_MONTHLY_LIMIT;

    // Contar tickets del mes actual para el proyecto
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const snapshot = await this.db
      .collection('support_tickets')
      .where('projectId', '==', projectId)
      .get();

    let used = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = (data.createdAt as unknown as admin.firestore.Timestamp)
        .toMillis
        ? (data.createdAt as unknown as admin.firestore.Timestamp).toMillis()
        : new Date(data.createdAt as string | number | Date).getTime();

      if (createdAt >= startOfMonth.getTime()) {
        used++;
      }
    });
    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  async createTicket(
    uid: string,
    email: string,
    dto: CreateTicketDto,
    file?: Express.Multer.File,
  ): Promise<TicketRecord> {
    // Verificar cuota
    const quota = await this.getTicketQuota(dto.projectId);
    if (quota.remaining <= 0) {
      throw new BadRequestException(
        `Este proyecto ha alcanzado su límite de ${quota.limit} tickets mensuales`,
      );
    }

    let attachmentPath = '';

    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Solo se permiten imágenes (PNG, JPEG, WEBP)',
        );
      }

      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        throw new BadRequestException('La imagen no debe superar los 5 MB');
      }

      const docRef = this.db.collection('support_tickets').doc();
      attachmentPath = `support_attachments/${uid}/${docRef.id}_${file.originalname}`;
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(attachmentPath);
      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });

      const now = new Date();
      const ticket: TicketRecord & { attachmentPath?: string } = {
        id: docRef.id,
        clientId: uid,
        clientEmail: email,
        subject: dto.subject,
        message: dto.message,
        priority: dto.priority || 'medium',
        status: 'open',
        adminResponse: '',
        projectId: dto.projectId,
        projectName: dto.projectName,
        attachmentPath,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(ticket);
      return ticket;
    }

    const docRef = this.db.collection('support_tickets').doc();
    const now = new Date();

    const ticket: TicketRecord = {
      id: docRef.id,
      clientId: uid,
      clientEmail: email,
      subject: dto.subject,
      message: dto.message,
      priority: dto.priority || 'medium',
      status: 'open',
      adminResponse: '',
      projectId: dto.projectId,
      projectName: dto.projectName,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(ticket);
    return ticket;
  }

  async findByClient(uid: string): Promise<TicketRecord[]> {
    const snapshot = await this.db
      .collection('support_tickets')
      .where('clientId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as TicketRecord);
  }

  async findAll(): Promise<TicketRecord[]> {
    const snapshot = await this.db
      .collection('support_tickets')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as TicketRecord);
  }

  async findById(
    ticketId: string,
    uid: string,
    role: string,
  ): Promise<TicketRecord & { attachmentUrl?: string }> {
    const doc = await this.db.collection('support_tickets').doc(ticketId).get();

    if (!doc.exists) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const data = doc.data() as TicketRecord & { attachmentPath?: string };

    if (role === 'client' && data.clientId !== uid) {
      throw new NotFoundException('Ticket no encontrado');
    }

    let attachmentUrl: string | undefined = undefined;

    if (data.attachmentPath) {
      try {
        const bucket = admin.storage().bucket();
        const fileRef = bucket.file(data.attachmentPath);
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });
        attachmentUrl = url;
      } catch (error) {
        console.error(
          'Error generating signed URL for ticket attachment:',
          error,
        );
      }
    }

    return {
      ...data,
      attachmentUrl,
    };
  }

  async updateTicket(
    ticketId: string,
    dto: UpdateTicketDto,
  ): Promise<TicketRecord> {
    const docRef = this.db.collection('support_tickets').doc(ticketId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.status) {
      updateData.status = dto.status;
    }
    if (dto.adminResponse !== undefined) {
      updateData.adminResponse = dto.adminResponse;
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    const ticketRecord = updated.data() as TicketRecord;

    // Al responder, notificar al cliente vía MailService
    if (
      dto.adminResponse &&
      dto.adminResponse.trim().length > 0 &&
      ticketRecord.clientEmail
    ) {
      void this.mailService.sendMail({
        from: '"Soporte WebAstro" <soporte@gabrielzavando.cl>',
        to: ticketRecord.clientEmail,
        subject: `Actualización de tu ticket: ${ticketRecord.subject}`,
        templateName: 'ticket-response',
        templateVariables: {
          subject: ticketRecord.subject,
          status: ticketRecord.status,
          message: ticketRecord.message,
          adminResponse: ticketRecord.adminResponse,
        },
      });
    }

    return ticketRecord;
  }
}
