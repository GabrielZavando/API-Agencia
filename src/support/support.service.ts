import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FirebaseService } from '../firebase/firebase.service';

export interface TicketRecord {
  id: string;
  clientId: string;
  clientEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved';
  adminResponse: string;
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
  constructor(private readonly _firebase: FirebaseService) {
    this.db = admin.firestore();
  }

  async getTicketQuota(uid: string): Promise<TicketQuota> {
    // Obtener límite del usuario
    const userDoc = await this.db.collection('users').doc(uid).get();

    const userData = userDoc.data() as Record<string, unknown> | undefined;
    const limit =
      (userData?.monthlyTicketLimit as number) ?? DEFAULT_MONTHLY_LIMIT;

    // Contar tickets del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const snapshot = await this.db
      .collection('support_tickets')
      .where('clientId', '==', uid)
      .where('createdAt', '>=', startOfMonth)
      .get();

    const used = snapshot.size;
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
  ): Promise<TicketRecord> {
    // Verificar cuota
    const quota = await this.getTicketQuota(uid);
    if (quota.remaining <= 0) {
      throw new BadRequestException(
        `Has alcanzado tu límite de ${quota.limit} ` + 'tickets mensuales',
      );
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
    return updated.data() as TicketRecord;
  }
}
