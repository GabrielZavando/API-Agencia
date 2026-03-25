import { SupportService } from './support.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { NotificationsService } from '../notifications/notifications.service'

// Mock firebase-admin
const mockDoc = vi.fn()
const mockSet = vi.fn()
const mockGet = vi.fn()
const mockUpdate = vi.fn()
const mockWhere = vi.fn()
const mockOrderBy = vi.fn()

vi.mock('firebase-admin', () => ({
  firestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
    })),
  })),
}))

describe('SupportService', () => {
  let service: SupportService
  let mockFirebaseService: any
  let mockMailService: any
  let mockNotificationsService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockDoc.mockReturnValue({
      id: 'ticket-123',
      set: mockSet,
      get: mockGet,
      update: mockUpdate,
    })

    // Default: usuario sin campo monthlyTicketLimit
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({}),
    })

    // Mock de where().get() para cuota
    const fakeWhere = vi.fn()
    const whereChain = {
      where: fakeWhere,
      get: vi.fn().mockResolvedValue({
        size: 0,
        docs: [],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        forEach: vi.fn((cb: any) => [].forEach(cb)),
      }),
    }
    fakeWhere.mockReturnValue(whereChain)
    mockWhere.mockReturnValue(whereChain)

    mockOrderBy.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        docs: [],
      }),
    })

    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn(() => ({
          doc: mockDoc,
          where: mockWhere,
          orderBy: mockOrderBy,
        })),
      }),
    }

    mockMailService = {
      sendMail: vi.fn().mockResolvedValue(true),
    }

    mockNotificationsService = {
      createNotification: vi.fn().mockResolvedValue(true),
    }

    service = new SupportService(
      mockFirebaseService as FirebaseService,
      mockMailService as MailService,
      mockNotificationsService as NotificationsService,
    )
  })

  it('debe estar definido', () => {
    expect(service).toBeDefined()
  })

  describe('getTicketQuota', () => {
    it('debe retornar límite por defecto de 3', async () => {
      const quota = await service.getTicketQuota('user-1')

      expect(quota.limit).toBe(3)
      expect(quota.used).toBe(0)
      expect(quota.remaining).toBe(3)
    })

    it('debe usar el límite personalizado del usuario', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ monthlyTicketLimit: 5 }),
      })

      const quota = await service.getTicketQuota('user-1')

      expect(quota.limit).toBe(5)
      expect(quota.remaining).toBe(5)
    })
  })

  describe('createTicket', () => {
    it('debe crear un ticket correctamente', async () => {
      mockSet.mockResolvedValue(undefined)

      const dto = {
        subject: 'Problema con factura',
        message: 'No puedo ver mi última factura',
        priority: 'high' as const,
        projectId: 'project-1',
        projectName: 'Project One',
      }

      const result = await service.createTicket('user-1', 'user@test.com', dto)

      expect(result.id).toBe('ticket-123')
      expect(result.subject).toBe('Problema con factura')
      expect(result.status).toBe('open')
      expect(result.priority).toBe('high')
      expect(result.projectId).toBe('project-1')
      expect(mockSet).toHaveBeenCalled()
    })

    it('debe rechazar si se excede la cuota', async () => {
      // Simular que ya usó 3 tickets
      const fakeWhere = vi.fn()
      const mockDocs = [
        { data: () => ({ createdAt: new Date() }) },
        { data: () => ({ createdAt: new Date() }) },
        { data: () => ({ createdAt: new Date() }) },
      ]
      const whereChain = {
        where: fakeWhere,
        get: vi.fn().mockResolvedValue({
          size: 3,
          docs: mockDocs,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          forEach: (cb: any) => mockDocs.forEach(cb),
        }),
      }
      fakeWhere.mockReturnValue(whereChain)
      mockWhere.mockReturnValue(whereChain)

      const dto = {
        subject: 'Otro ticket',
        message: 'Contenido',
        projectId: 'project-1',
        projectName: 'Project One',
      }

      await expect(
        service.createTicket('user-1', 'user@test.com', dto),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('updateTicket', () => {
    it('debe lanzar NotFoundException si no existe', async () => {
      mockGet.mockResolvedValue({ exists: false })

      await expect(
        service.updateTicket('invalid', {
          status: 'resolved',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('debe actualizar el estado del ticket', async () => {
      mockGet.mockResolvedValueOnce({ exists: true }).mockResolvedValueOnce({
        data: () => ({
          id: 'ticket-123',
          status: 'resolved',
          adminResponse: 'Resuelto',
          clientId: 'user-1',
          clientEmail: 'user@test.com',
          subject: 'Test',
        }),
      })

      mockUpdate.mockResolvedValue(undefined)

      const result = await service.updateTicket('ticket-123', {
        status: 'resolved',
        adminResponse: 'Resuelto',
      })

      expect(result.status).toBe('resolved')
      expect(mockUpdate).toHaveBeenCalled()
    })
  })
})
