import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

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

const DEFAULT_MONTHLY_LIMIT = 3;

@Injectable()
export class SupportService {
  private db: admin.firestore.Firestore;

  // Inyectar FirebaseService garantiza que Firebase
  // esté inicializado antes de usarlo
  constructor(
    private readonly _firebase: FirebaseService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
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

      // Notificar a todos los administradores (sin await para no bloquear la iteración principal)
      this.notifyAdmins(
        'Nuevo Ticket Creado',
        `El cliente ${email} ha abierto el ticket: ${dto.subject}`,
        `/admin/tickets/${ticket.id}`,
      ).catch((e) =>
        console.error('Error notificando admins sobre nuevo ticket', e),
      );

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
  ): Promise<
    TicketRecord & { attachmentUrl?: string; clientPhotoUrl?: string }
  > {
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
      } catch {
        console.error('Error generating signed URL for ticket attachment:');
      }
    }

    let clientPhotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.clientEmail || 'User')}&background=random&rounded=false`;
    try {
      const userDoc = await this.db
        .collection('users')
        .doc(data.clientId)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data() as { photoURL?: string } | undefined;
        if (userData && userData.photoURL) {
          const photoUrlUnrounded = userData.photoURL
            .replace('&rounded=true', '&rounded=false')
            .replace('rounded=true&', '');
          clientPhotoUrl = photoUrlUnrounded;
        }
      }
    } catch (err) {
      console.error('Error fetching user photo for ticket:', err);
    }

    return {
      ...data,
      attachmentUrl,
      clientPhotoUrl,
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
      this.mailService
        .sendMail({
          to: ticketRecord.clientEmail,
          account: 'SUPPORT',
          subject: `Actualización de tu ticket: ${ticketRecord.subject}`,
          templateName: 'ticket-response',
          templateVariables: {
            subject: ticketRecord.subject,
            status: ticketRecord.status,
            message: ticketRecord.message,
            adminResponse: ticketRecord.adminResponse,
          },
        })
        .catch((err) => console.error('Error enviando email soporte', err));

      this.notificationsService
        .createNotification({
          title: 'Respuesta en Ticket',
          message: `El equipo de soporte ha respondido a tu ticket: ${ticketRecord.subject}`,
          userId: ticketRecord.clientId,
          link: `/dashboard/soporte/${ticketRecord.id}`,
        })
        .catch((err) => console.error('Error creando notificación', err));
    }

    return ticketRecord;
  }

  // ── Helpers ──
  private async notifyAdmins(title: string, message: string, link: string) {
    try {
      const adminsSnapshot = await this.db
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      if (adminsSnapshot.empty) return;

      const promises = adminsSnapshot.docs.map((doc) =>
        this.notificationsService.createNotification({
          title,
          message,
          userId: doc.id,
          link,
        }),
      );

      await Promise.all(promises);
    } catch (e) {
      console.error('Error en notifyAdmins:', e);
    }
  }

  // ────────────── Conversation Messages ──────────────

  async addMessage(
    ticketId: string,
    dto: AddMessageDto,
    senderEmail: string,
    file?: Express.Multer.File,
  ): Promise<Record<string, unknown>> {
    const docRef = this.db.collection('support_tickets').doc(ticketId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const ticket = doc.data() as TicketRecord;

    if (ticket.status === 'resolved') {
      throw new BadRequestException(
        'No se pueden enviar mensajes a un ticket resuelto',
      );
    }

    const msgRef = docRef.collection('messages').doc();
    const now = new Date();
    const message: Record<string, any> = {
      id: msgRef.id,
      body: dto.body,
      senderRole: dto.senderRole,
      senderEmail,
      createdAt: now,
      senderPhotoUrl: dto.senderPhotoUrl || null,
    };

    if (file) {
      const bucket = admin.storage().bucket();
      const ext = file.originalname.split('.').pop() || 'jpg';
      const path = `support_attachments/msg_${msgRef.id}_${Date.now()}.${ext}`;
      const fileInBucket = bucket.file(path);

      await fileInBucket.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      message.attachmentPath = path;
    }

    await msgRef.set(message);

    // Si el admin envía un mensaje, notificar al cliente
    if (dto.senderRole === 'admin') {
      this.notificationsService
        .createNotification({
          title: 'Nuevo mensaje en tu ticket',
          message: `El equipo de soporte te ha respondido en el ticket: ${ticket.subject}`,
          userId: ticket.clientId,
          link: `/dashboard/soporte/${ticketId}`,
        })
        .catch((e) => console.error('Error notifying client:', e));
    } else {
      // Si el cliente responde, notificar a los administradores
      this.notifyAdmins(
        'Nuevo mensaje de cliente',
        `El cliente ha respondido en el ticket: ${ticket.subject}`,
        `/admin/tickets/${ticketId}`,
      ).catch((e) =>
        console.error('Error notificando admins sobre nuevo mensaje', e),
      );
    }

    return message;
  }

  async getMessages(ticketId: string): Promise<Record<string, unknown>[]> {
    const snapshot = await this.db
      .collection('support_tickets')
      .doc(ticketId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get();

    const messages = snapshot.docs.map((d) => d.data());

    // Generar URLs firmadas para los adjuntos
    const bucket = admin.storage().bucket();
    const processedMessages = await Promise.all(
      messages.map(async (m) => {
        if (m.attachmentPath) {
          try {
            const fileRef = bucket.file(m.attachmentPath as string);
            const [url] = await fileRef.getSignedUrl({
              action: 'read',
              expires: Date.now() + 60 * 60 * 1000,
            });
            return { ...m, attachmentUrl: url };
          } catch (e) {
            console.error(
              'Error generating signed URL for message attachment:',
              e,
            );
          }
        }
        return m;
      }),
    );

    return processedMessages;
  }

  async deleteTicket(id: string): Promise<void> {
    const docRef = this.db.collection('support_tickets').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const data = doc.data() as TicketRecord & { attachmentPath?: string };
    const bucket = admin.storage().bucket();

    // 1. Eliminar adjunto del ticket si existe
    if (data.attachmentPath) {
      try {
        await bucket.file(data.attachmentPath).delete();
      } catch (e) {
        console.error('Error deleting ticket attachment:', e);
      }
    }

    // 2. Eliminar mensajes y sus adjuntos
    const messagesSnapshot = await docRef.collection('messages').get();
    const deletePromises = messagesSnapshot.docs.map(async (msgDoc) => {
      const msgData = msgDoc.data();
      if (msgData.attachmentPath) {
        try {
          await bucket.file(msgData.attachmentPath as string).delete();
        } catch (e) {
          console.error('Error deleting message attachment:', e);
        }
      }
      return msgDoc.ref.delete();
    });

    await Promise.all(deletePromises);

    // 3. Eliminar el ticket
    await docRef.delete();
  }
}
