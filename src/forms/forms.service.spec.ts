import { FormsService } from './forms.service'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { ConfigService } from '@nestjs/config'
import { BlogService } from '../blog/blog.service'
import { SystemConfigService } from '../system-config/system-config.service'
import { SchedulerRegistry } from '@nestjs/schedule'

const mockFirebaseService = {
  findContactoByEmail: vi.fn(),
  saveContacto: vi.fn().mockResolvedValue('contacto-123'),
  addConsultaToContacto: vi.fn().mockResolvedValue('consulta-456'),
  markConsultaEmailAsSent: vi.fn().mockResolvedValue(undefined),
  findSubscriberByEmail: vi.fn().mockResolvedValue(null),
  saveSubscriber: vi.fn().mockResolvedValue('sub-id'),
  getSubscriberConfirmationToken: vi.fn().mockResolvedValue('token-abc'),
  confirmSubscriber: vi.fn().mockResolvedValue({ success: true }),
  getAllSubscribers: vi.fn().mockResolvedValue([]),
  removeSubscriber: vi.fn().mockResolvedValue(true),
  getDb: vi.fn(),
  testConnection: vi.fn().mockResolvedValue({ success: true }),
  bulkDeleteSubscribers: vi.fn().mockResolvedValue(2),
  refreshReconfirmationToken: vi.fn().mockResolvedValue('new-token'),
  markSubscribersUnconfirmed: vi.fn(),
}

const mockMailService = {
  sendMail: vi.fn().mockResolvedValue(true),
  sendMailDetailed: vi.fn().mockResolvedValue({ success: true }),
  getBaseVariables: vi.fn().mockResolvedValue({}),
  testConnection: vi.fn().mockResolvedValue({ success: true }),
}

const mockConfigService = {
  get: vi.fn().mockReturnValue(undefined),
}

const mockBlogService = {}

const mockSystemConfigService = {
  getConfig: vi.fn().mockResolvedValue({ email: 'admin@test.com' }),
}

const mockCronJob = {
  running: false,
  start: vi.fn().mockImplementation(function () {
    this.running = true
  }),
  stop: vi.fn().mockImplementation(function () {
    this.running = false
  }),
}

const mockSchedulerRegistry = {
  getCronJob: vi.fn().mockReturnValue(mockCronJob),
}

// Mock de librerías externas
vi.mock('disposable-email-domains', () => ({
  default: ['mailinator.com', 'tempmail.com'],
}))
vi.mock('deep-email-validator', () => ({
  validate: vi.fn().mockResolvedValue({ valid: true }),
}))

describe('FormsService — handleContact', () => {
  let service: FormsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FormsService(
      mockFirebaseService as unknown as FirebaseService,
      mockMailService as unknown as MailService,
      mockConfigService as unknown as ConfigService,
      mockBlogService as unknown as BlogService,
      mockSystemConfigService as unknown as SystemConfigService,
      mockSchedulerRegistry as unknown as SchedulerRegistry,
    )
  })

  const baseContactDto = {
    name: 'Pablo Torres',
    email: 'pablo@empresa.com',
    phone: '+56911223344',
    message: 'Necesito información sobre sus servicios',
    meta: {
      userAgent: 'Mozilla',
      page: '/contacto',
      ts: new Date().toISOString(),
    },
  }

  describe('cuando el contacto es nuevo', () => {
    it('debe guardar el contacto, crear una consulta y enviar emails', async () => {
      // Arrange
      mockFirebaseService.findContactoByEmail.mockResolvedValueOnce(null)

      // Act
      const result = await service.handleContact(baseContactDto)

      // Assert
      expect(result.success).toBe(true)
      expect(result.contactoId).toBe('contacto-123')
      expect(result.consultaId).toBe('consulta-456')
      expect(result.isNewProspect).toBe(true)
      expect(mockFirebaseService.saveContacto).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'pablo@empresa.com',
          origen: 'formulario_contacto',
        }),
      )
      expect(mockFirebaseService.addConsultaToContacto).toHaveBeenCalledWith(
        'contacto-123',
        expect.objectContaining({
          contenido: baseContactDto.message,
          estado: 'respondida_automaticamente',
        }),
      )
    })

    it('debe marcar el email como enviado en la consulta si el envío tuvo éxito', async () => {
      // Arrange
      mockFirebaseService.findContactoByEmail.mockResolvedValueOnce(null)
      mockMailService.sendMail.mockResolvedValue(true)

      // Act
      await service.handleContact(baseContactDto)

      // Assert
      expect(mockFirebaseService.markConsultaEmailAsSent).toHaveBeenCalledWith(
        'contacto-123',
        'consulta-456',
      )
    })
  })

  describe('cuando el contacto ya existe', () => {
    it('debe actualizar el contacto y registrar la nueva consulta', async () => {
      // Arrange
      mockFirebaseService.findContactoByEmail.mockResolvedValueOnce({
        contactoId: 'contacto-123',
        name: 'Pablo Torres',
        email: 'pablo@empresa.com',
      })

      // Act
      const result = await service.handleContact(baseContactDto)

      // Assert
      expect(result.success).toBe(true)
      expect(result.isNewProspect).toBe(false)
      // Se sigue creando una nueva consulta para el contacto existente
      expect(mockFirebaseService.addConsultaToContacto).toHaveBeenCalled()
    })
  })

  describe('validaciones anti-spam', () => {
    it('debe rechazar dominios de correo desechables', async () => {
      // Arrange
      const dto = { ...baseContactDto, email: 'test@mailinator.com' }

      // Act
      const result = await service.handleContact(dto)

      // Assert
      expect(result.success).toBe(false)
      expect(result.message).toContain('correo electrónico permanente')
    })
  })

  describe('Gestión Dinámica de Cron — Suscriptores', () => {
    it('debe reactivar el cron cuando se envían confirmaciones en lote', async () => {
      // Arrange
      mockCronJob.running = false
      mockFirebaseService.getAllSubscribers.mockResolvedValueOnce([
        { subscriberId: 'sub-1', email: 'test1@test.com', status: 'pending' },
      ])
      mockFirebaseService.refreshReconfirmationToken.mockResolvedValueOnce(
        'token-1',
      )

      // Act
      await service.bulkConfirmSubscribers(['sub-1'])

      // Assert
      expect(mockCronJob.start).toHaveBeenCalled()
      expect(mockCronJob.running).toBe(true)
    })

    it('debe detener el cron si no hay suscriptores en estado "sent"', async () => {
      // Arrange
      mockCronJob.running = true
      // No hay suscriptores con status 'sent'
      mockFirebaseService.getAllSubscribers.mockResolvedValueOnce([
        { subscriberId: 'sub-1', email: 'test1@test.com', status: 'confirmed' },
      ])

      // Act
      await service.cronMarkUnconfirmed()

      // Assert
      expect(mockCronJob.stop).toHaveBeenCalled()
      expect(mockCronJob.running).toBe(false)
    })

    it('debe mantener el cron corriendo si aún hay suscriptores pendientes de 72h', async () => {
      // Arrange
      mockCronJob.running = true
      mockFirebaseService.getAllSubscribers.mockResolvedValue([
        { subscriberId: 'sub-1', email: 'sent@test.com', status: 'sent' },
        { subscriberId: 'sub-2', email: 'sent2@test.com', status: 'sent' },
      ])
      // Simulamos que markSubscribersUnconfirmed procesa 1, pero queda 1
      mockFirebaseService.markSubscribersUnconfirmed.mockResolvedValueOnce(1)

      // Act
      await service.cronMarkUnconfirmed()

      // Assert
      expect(mockCronJob.stop).not.toHaveBeenCalled()
      expect(mockCronJob.running).toBe(true)
    })
  })
})
