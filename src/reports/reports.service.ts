import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import * as admin from 'firebase-admin'
import { CreateReportDto } from './dto/create-report.dto'
import { FirebaseService } from '../firebase/firebase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { MailService } from '../mail/mail.service'
import { UsersService } from '../users/users.service'
import { ReportResponseDto } from './dto/report-response.dto'
import { ReportRecord } from './interfaces/report.interface'

@Injectable()
export class ReportsService {
  private db: admin.firestore.Firestore
  private storage: admin.storage.Storage

  constructor(
    private readonly _firebase: FirebaseService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {
    this.db = this._firebase.getDb()
    this.storage = admin.storage()
  }

  private mapReportToDto(data: ReportRecord): ReportResponseDto {
    return {
      id: data.id,
      clientId: data.clientId,
      title: data.title,
      description: data.description,
      fileName: data.fileName,
      storagePath: data.storagePath,
      mimeType: data.mimeType,
      size: data.size,
      projectId: data.projectId,
      projectName: data.projectName,
      createdAt: data.createdAt,
    }
  }

  /** Admin sube un informe PDF para un cliente */
  async uploadReport(
    file: Express.Multer.File,
    dto: CreateReportDto,
  ): Promise<ReportResponseDto> {
    if (!file || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('El archivo debe ser un PDF válido')
    }

    const docRef = this.db.collection('reports').doc()
    const storagePath = `reports/${dto.clientId}/${docRef.id}_${file.originalname}`

    const bucket = this.storage.bucket()
    const fileRef = bucket.file(storagePath)
    await fileRef.save(file.buffer, {
      metadata: { contentType: 'application/pdf' },
    })

    const reportData: ReportRecord = {
      id: docRef.id,
      clientId: dto.clientId,
      title: dto.title,
      description: dto.description || '',
      fileName: file.originalname,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
      projectId: dto.projectId || '',
      projectName: dto.projectName || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    await docRef.set(reportData)

    try {
      await this.notificationsService.create(
        dto.clientId,
        'Nuevo Informe Recibido',
        `Has recibido el informe: ${dto.title}${
          dto.projectName ? ` para el proyecto ${dto.projectName}` : ''
        }.`,
        'info',
        '/dashboard/informes',
      )
    } catch (error) {
      console.error('Error creando notificación de informe:', error)
    }

    try {
      const user = await this.usersService.findOne(dto.clientId)
      if (user && user.email) {
        await this.mailService.sendMail({
          to: user.email,
          account: 'SUPPORT',
          subject: `Nuevo Informe: ${dto.title}`,
          templateName: 'report-delivery',
          templateVariables: {
            clientName: user.displayName || 'Cliente',
            reportTitle: dto.title,
            reportProject: dto.projectName || 'General',
            reportDescription: dto.description || '',
          },
          attachments: [
            {
              filename: file.originalname,
              content: file.buffer,
              contentType: 'application/pdf',
            },
          ],
        })
      }
    } catch (error) {
      console.error('Error enviando correo de informe:', error)
    }

    return this.mapReportToDto(reportData)
  }

  async findByClient(clientId: string): Promise<ReportResponseDto[]> {
    const snapshot = await this.db
      .collection('reports')
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) =>
      this.mapReportToDto(doc.data() as ReportRecord),
    )
  }

  async findAll(): Promise<ReportResponseDto[]> {
    const snapshot = await this.db
      .collection('reports')
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((doc) =>
      this.mapReportToDto(doc.data() as ReportRecord),
    )
  }

  async getDownloadUrl(
    reportId: string,
    user: { uid: string; role?: string },
    isDownload: boolean = false,
  ): Promise<{ url: string; fileName: string }> {
    const doc = await this.db.collection('reports').doc(reportId).get()

    if (!doc.exists) {
      throw new NotFoundException('Informe no encontrado')
    }

    const report = doc.data() as ReportRecord

    if (user.role !== 'admin' && report.clientId !== user.uid) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este informe',
      )
    }

    const bucket = this.storage.bucket()
    const fileRef = bucket.file(report.storagePath)

    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: isDownload
        ? `attachment; filename="${report.fileName}"`
        : 'inline',
    })

    return { url, fileName: report.fileName }
  }

  async deleteReport(reportId: string): Promise<void> {
    const doc = await this.db.collection('reports').doc(reportId).get()

    if (!doc.exists) {
      throw new NotFoundException('Informe no encontrado')
    }

    const report = doc.data() as ReportRecord

    try {
      const bucket = this.storage.bucket()
      await bucket.file(report.storagePath).delete()
    } catch (error) {
      console.error('Error eliminando archivo de Storage:', error)
    }

    await this.db.collection('reports').doc(reportId).delete()
  }
}
