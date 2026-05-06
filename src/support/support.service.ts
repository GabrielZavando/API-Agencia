import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import * as admin from 'firebase-admin'
import { ConfigService } from '@nestjs/config'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { AddMessageDto } from './dto/add-message.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { NotificationsService } from '../notifications/notifications.service'
import { TicketResponseDto } from './dto/ticket-response.dto'
import { MessageResponseDto } from './dto/message-response.dto'
import { TicketQuota } from './interfaces/support.interface'
import { TemplateService } from '../templates/template.service'
import * as React from 'react'

const DEFAULT_MONTHLY_LIMIT = 3

@Injectable()
export class SupportService {
  private db: admin.firestore.Firestore

  constructor(
    private readonly _firebase: FirebaseService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.db = this._firebase.getDb()
  }

  private mapTicketToDto(
    doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
  ): TicketResponseDto {
    const data = doc.data() || {}
    return {
      id: doc.id,
      clientId: data.clientId as string,
      clientEmail: data.clientEmail as string,
      subject: (data.subject as string) || '',
      message: (data.message as string) || '',
      priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
      status: (data.status as 'open' | 'in-progress' | 'resolved') || 'open',
      adminResponse: (data.adminResponse as string) || '',
      projectId: (data.projectId as string) || '',
      projectName: (data.projectName as string) || '',
      attachmentPath: data.attachmentPath as string,
      createdAt: data.createdAt as
        | admin.firestore.Timestamp
        | admin.firestore.FieldValue
        | string
        | number,
      updatedAt: data.updatedAt as
        | admin.firestore.Timestamp
        | admin.firestore.FieldValue
        | string
        | number,
    }
  }

  private mapMessageToDto(
    doc: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>,
  ): MessageResponseDto {
    const data = doc.data() || {}
    return {
      id: doc.id,
      body: (data.body as string) || '',
      senderRole: (data.senderRole as 'client' | 'admin') || 'client',
      senderEmail: (data.senderEmail as string) || '',
      senderPhotoUrl: data.senderPhotoUrl as string,
      attachmentPath: data.attachmentPath as string,
      createdAt: data.createdAt as
        | admin.firestore.Timestamp
        | admin.firestore.FieldValue
        | string
        | number,
    }
  }

  async getTicketQuota(projectId: string): Promise<TicketQuota> {
    const projectDoc = await this.db.collection('projects').doc(projectId).get()
    if (!projectDoc.exists) {
      throw new NotFoundException('Proyecto no encontrado')
    }

    const projectData = projectDoc.data()
    const limit =
      (projectData?.monthlyTicketLimit as number) ?? DEFAULT_MONTHLY_LIMIT

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const snapshot = await this.db
      .collection('support_tickets')
      .where('projectId', '==', projectId)
      .get()

    let used = 0
    snapshot.forEach((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt as
        | admin.firestore.Timestamp
        | admin.firestore.FieldValue
        | string
        | number
      const millis = this.getMillis(createdAt)
      if (millis >= startOfMonth.getTime()) {
        used++
      }
    })

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
    }
  }

  private getMillis(date: unknown): number {
    if (!date) return 0
    if (date instanceof admin.firestore.Timestamp) return date.toMillis()
    if (date instanceof Date) return date.getTime()
    if (typeof date === 'object' && date !== null) {
      const d = date as Record<string, unknown>
      if (typeof d.toMillis === 'function') {
        return (d.toMillis as () => number)()
      }
      if (typeof d.seconds === 'number') return d.seconds * 1000
    }
    if (typeof date === 'string' || typeof date === 'number') {
      const val = new Date(date).getTime()
      return isNaN(val) ? 0 : val
    }
    return 0
  }

  async createTicket(
    uid: string,
    email: string,
    dto: CreateTicketDto,
    file?: Express.Multer.File,
  ): Promise<TicketResponseDto> {
    const quota = await this.getTicketQuota(dto.projectId)
    if (quota.remaining <= 0) {
      throw new BadRequestException(
        `Este proyecto ha alcanzado su límite de ${quota.limit} tickets mensuales`,
      )
    }

    const docRef = this.db.collection('support_tickets').doc()
    let attachmentPath = ''

    if (file) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Solo se permiten imágenes (PNG, JPEG, WEBP)',
        )
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('La imagen no debe superar los 5 MB')
      }

      attachmentPath = `support_attachments/${uid}/${docRef.id}_${file.originalname}`
      const fileRef = admin.storage().bucket().file(attachmentPath)
      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      })
    }

    const now = admin.firestore.FieldValue.serverTimestamp()
    const ticketData = {
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
    }

    await docRef.set(ticketData)

    this.notifyAdmins(
      'Nuevo Ticket Creado',
      `El cliente ${email} ha abierto el ticket: ${dto.subject}`,
      `/admin/tickets/${docRef.id}`,
    ).catch((e) =>
      console.error('Error notificando admins sobre nuevo ticket', e),
    )

    const adminEmail =
      this.configService.get<string>('MAIL_ADMIN_ADDRESS') ??
      'contacto@gabrielzavando.cl'
    const baseVars = this.mailService.getBaseVariables(adminEmail)
    const TicketCreatedComponent = (
      await import('../templates/react/ticket-created')
    ).TicketCreated

    try {
      await this.mailService.sendMail({
        to: adminEmail,
        account: 'ADMIN',
        subject: `[SOPORTE] Nuevo Ticket: ${dto.subject}`,
        html: await this.templateService.renderReactTemplate(
          React.createElement(TicketCreatedComponent, {
            ...baseVars,
            clientEmail: email,
            subject: dto.subject,
            message: dto.message,
            priority: dto.priority || 'medium',
            ticketId: docRef.id,
            date: new Date().toLocaleString('es-ES'),
            previewText: 'Nuevo ticket de soporte técnico',
            websiteUrl: baseVars['websiteUrl'] as string,
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (e) {
      console.error('Error enviando email de nuevo ticket al admin', e)
    }

    const savedDoc = await docRef.get()
    return this.mapTicketToDto(savedDoc)
  }

  async findByClient(uid: string): Promise<TicketResponseDto[]> {
    const snapshot = await this.db
      .collection('support_tickets')
      .where('clientId', '==', uid)
      .get()

    const tickets = snapshot.docs.map((doc) => this.mapTicketToDto(doc))
    return tickets.sort(
      (a, b) => this.getMillis(b.createdAt) - this.getMillis(a.createdAt),
    )
  }

  async findAll(): Promise<TicketResponseDto[]> {
    const snapshot = await this.db.collection('support_tickets').get()

    const tickets = snapshot.docs.map((doc) => this.mapTicketToDto(doc))
    return tickets.sort(
      (a, b) => this.getMillis(b.createdAt) - this.getMillis(a.createdAt),
    )
  }

  async findById(
    ticketId: string,
    uid: string,
    role: string,
  ): Promise<TicketResponseDto> {
    const doc = await this.db.collection('support_tickets').doc(ticketId).get()
    if (!doc.exists) {
      throw new NotFoundException('Ticket no encontrado')
    }

    const dto = this.mapTicketToDto(doc)
    if (role === 'client' && dto.clientId !== uid) {
      throw new NotFoundException('Ticket no encontrado')
    }

    if (dto.attachmentPath) {
      try {
        const fileRef = admin.storage().bucket().file(dto.attachmentPath)
        const [url] = await fileRef.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
        })
        dto.attachmentUrl = url
      } catch (e) {
        console.error('Error generando signed URL:', e)
      }
    }

    dto.clientPhotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.clientEmail || 'User')}&background=random&rounded=false`
    try {
      const userDoc = await this.db.collection('users').doc(dto.clientId).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        if (userData?.photoURL) {
          dto.clientPhotoUrl = (userData.photoURL as string)
            .replace('&rounded=true', '&rounded=false')
            .replace('rounded=true&', '')
        }
      }
    } catch (err) {
      console.error('Error fetching user photo:', err)
    }

    return dto
  }

  async updateTicket(
    ticketId: string,
    dto: UpdateTicketDto,
  ): Promise<TicketResponseDto> {
    const docRef = this.db.collection('support_tickets').doc(ticketId)
    const doc = await docRef.get()
    if (!doc.exists) {
      throw new NotFoundException('Ticket no encontrado')
    }

    const updateData: Record<string, string | admin.firestore.FieldValue> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    if (dto.status) updateData.status = dto.status
    if (dto.adminResponse !== undefined) {
      updateData.adminResponse = dto.adminResponse
    }

    await docRef.update(updateData)
    const updated = await docRef.get()
    const ticketDto = this.mapTicketToDto(updated)

    if (dto.adminResponse && dto.adminResponse.trim().length > 0) {
      this.sendResponseNotifications(ticketDto).catch((e) =>
        console.error('Error in sendResponseNotifications:', e),
      )
    }

    return ticketDto
  }

  private async sendResponseNotifications(ticketDto: TicketResponseDto) {
    let clientName = 'Cliente'
    try {
      const userDoc = await this.db
        .collection('users')
        .doc(ticketDto.clientId)
        .get()
      if (userDoc.exists) {
        const data = userDoc.data() as Record<string, string> | undefined
        clientName = data?.displayName || data?.name || 'Cliente'
      }
    } catch (err) {
      console.error('Error fetching client name:', err)
    }

    const baseVars = this.mailService.getBaseVariables(ticketDto.clientEmail)
    const TicketResponseComponent = (
      await import('../templates/react/ticket-response')
    ).TicketResponse

    try {
      await this.mailService.sendMail({
        to: ticketDto.clientEmail,
        account: 'SUPPORT',
        subject: `Actualización de tu ticket: ${ticketDto.subject}`,
        html: await this.templateService.renderReactTemplate(
          React.createElement(TicketResponseComponent, {
            ...baseVars,
            userName: clientName,
            ticketId: ticketDto.id,
            ticketSubject: ticketDto.subject,
            responseMessage: ticketDto.adminResponse || '',
            previewText: 'Tienes una respuesta en tu ticket de soporte',
            websiteUrl: baseVars['websiteUrl'] as string,
            logoUrl: baseVars['logoUrl'] as string,
            companyName: baseVars['companyName'] as string,
            address: baseVars['address'] as string,
            email: baseVars['email'] as string,
            currentYear: baseVars['currentYear'] as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            social: baseVars['social'] as any,
          }),
        ),
      })
    } catch (e) {
      console.error('Error sending mail:', e)
    }

    this.notificationsService
      .create(
        ticketDto.clientId,
        'Respuesta en Ticket',
        `El equipo de soporte ha respondido a tu ticket: ${ticketDto.subject}`,
        'info',
        `/dashboard/soporte/${ticketDto.id}`,
      )
      .catch((e) => console.error('Error creating notification:', e))
  }

  private async notifyAdmins(title: string, message: string, link: string) {
    try {
      const admins = await this.db
        .collection('users')
        .where('role', '==', 'admin')
        .get()

      const promises = admins.docs.map((doc) =>
        this.notificationsService.create(doc.id, title, message, 'info', link),
      )
      await Promise.all(promises)
    } catch (e) {
      console.error('Error in notifyAdmins:', e)
    }
  }

  async addMessage(
    ticketId: string,
    dto: AddMessageDto,
    senderEmail: string,
    file?: Express.Multer.File,
  ): Promise<MessageResponseDto> {
    const docRef = this.db.collection('support_tickets').doc(ticketId)
    const doc = await docRef.get()
    if (!doc.exists) throw new NotFoundException('Ticket no encontrado')

    const ticket = this.mapTicketToDto(doc)
    if (ticket.status === 'resolved') {
      throw new BadRequestException(
        'No se pueden enviar mensajes a un ticket resuelto',
      )
    }

    const msgRef = docRef.collection('messages').doc()
    let attachmentPath = ''
    if (file) {
      const ext = file.originalname.split('.').pop() || 'jpg'
      attachmentPath = `support_attachments/msg_${msgRef.id}_${Date.now()}.${ext}`
      await admin
        .storage()
        .bucket()
        .file(attachmentPath)
        .save(file.buffer, {
          metadata: { contentType: file.mimetype },
        })
    }

    const messageData = {
      body: dto.body,
      senderRole: dto.senderRole,
      senderEmail,
      senderPhotoUrl: dto.senderPhotoUrl || null,
      attachmentPath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await msgRef.set(messageData)

    if (dto.senderRole === 'admin') {
      this.notificationsService
        .create(
          ticket.clientId,
          'Nuevo mensaje en tu ticket',
          `El equipo de soporte te ha respondido en el ticket: ${ticket.subject}`,
          'info',
          `/dashboard/soporte/${ticketId}`,
        )
        .catch((e) => console.error('Error notifying client:', e))
    } else {
      this.notifyAdmins(
        'Nuevo mensaje de cliente',
        `El cliente ha respondido en el ticket: ${ticket.subject}`,
        `/admin/tickets/${ticketId}`,
      ).catch((e) => console.error('Error notifying admins:', e))

      // Notificación por EMAIL al administrador (Réplica de Cliente)
      const adminEmail =
        this.configService.get<string>('MAIL_ADMIN_ADDRESS') ??
        'contacto@gabrielzavando.cl'
      const baseVars = this.mailService.getBaseVariables(adminEmail)
      const TicketReplyComponent = (
        await import('../templates/react/ticket-reply')
      ).TicketReply

      try {
        await this.mailService.sendMail({
          to: adminEmail,
          account: 'ADMIN',
          subject: `[SOPORTE] Nueva Réplica: ${ticket.subject}`,
          html: await this.templateService.renderReactTemplate(
            React.createElement(TicketReplyComponent, {
              ...baseVars,
              clientEmail: senderEmail,
              message: dto.body,
              ticketId: ticketId,
              date: new Date().toLocaleString('es-ES'),
              previewText: 'Nueva réplica de cliente en ticket de soporte',
              websiteUrl: baseVars['websiteUrl'] as string,
              logoUrl: baseVars['logoUrl'] as string,
              companyName: baseVars['companyName'] as string,
              address: baseVars['address'] as string,
              email: baseVars['email'] as string,
              currentYear: baseVars['currentYear'] as string,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              social: baseVars['social'] as any,
            }),
          ),
        })
      } catch (e) {
        console.error('Error enviando email de réplica al admin', e)
      }
    }

    const savedMsg = await msgRef.get()
    return this.mapMessageToDto(savedMsg)
  }

  async getMessages(ticketId: string): Promise<MessageResponseDto[]> {
    const snapshot = await this.db
      .collection('support_tickets')
      .doc(ticketId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .get()

    const messages = snapshot.docs.map((doc) => this.mapMessageToDto(doc))
    const bucket = admin.storage().bucket()

    const processed = await Promise.all(
      messages.map(async (m) => {
        if (m.attachmentPath) {
          try {
            const [url] = await bucket.file(m.attachmentPath).getSignedUrl({
              action: 'read',
              expires: Date.now() + 60 * 60 * 1000,
            })
            m.attachmentUrl = url
          } catch (e) {
            console.error('Error generating signed URL for message:', e)
          }
        }
        return m
      }),
    )

    return processed
  }

  async deleteTicket(id: string): Promise<void> {
    const docRef = this.db.collection('support_tickets').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) throw new NotFoundException('Ticket no encontrado')

    const ticket = this.mapTicketToDto(doc)
    const bucket = admin.storage().bucket()

    if (ticket.attachmentPath) {
      try {
        await bucket.file(ticket.attachmentPath).delete()
      } catch (e) {
        console.error(e)
      }
    }

    const messages = await docRef.collection('messages').get()
    const deletePromises = messages.docs.map(async (msgDoc) => {
      const msg = this.mapMessageToDto(msgDoc)
      if (msg.attachmentPath) {
        try {
          await bucket.file(msg.attachmentPath).delete()
        } catch (e) {
          console.error(e)
        }
      }
      return msgDoc.ref.delete()
    })

    await Promise.all(deletePromises)
    await docRef.delete()
  }
}
