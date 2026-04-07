import { SupportService } from './support.service'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { NotificationsService } from '../notifications/notifications.service'
import * as common from '@nestjs/common'

const { NotFoundException } = common

import {
  mockDoc,
  mockDocGet,
  mockCollection,
  mockCollectionGet,
  mockAdd,
  mockSet,
  mockUpdate,
} from '../../test/mocks/firebase-admin'

describe('SupportService', () => {
  let service: SupportService
  let mockFirebaseService: any
  let mockMailService: any
  let mockNotificationsService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockDoc.mockReturnValue({
      id: 'ticket-id',
      get: mockDocGet.mockResolvedValue({
        exists: true,
        id: 'ticket-id',
        data: () => ({
          clientId: 'user-1',
          subject: 'Test',
          message: 'Hello',
        }),
      }),
      set: mockSet.mockResolvedValue(true),
      update: mockUpdate.mockResolvedValue(true),
      delete: vi.fn(),
      collection: vi.fn(),
    })

    const mockQuerySnapshot = {
      size: 0,
      forEach: (cb: (doc: any) => void) => [].forEach(cb),
    }

    mockCollection.mockReturnValue({
      doc: mockDoc,
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: mockCollectionGet.mockResolvedValue(mockQuerySnapshot),
      add: mockAdd.mockResolvedValue({ id: 'new-ticket-id' }),
    })

    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: mockCollection,
      }),
    }

    mockMailService = {
      sendMail: vi.fn().mockResolvedValue(true),
    }

    mockNotificationsService = {
      create: vi.fn().mockResolvedValue({ id: 'test-notif-id' }),
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
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({}),
      })

      const quota = await service.getTicketQuota('project-1')
      expect(quota.limit).toBe(3)
      expect(quota.used).toBe(0)
      expect(quota.remaining).toBe(3)
    })

    it('debe usar el límite personalizado del proyecto', async () => {
      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({ monthlyTicketLimit: 5 }),
      })

      const quota = await service.getTicketQuota('project-1')

      expect(quota.limit).toBe(5)
      expect(quota.remaining).toBe(5)
    })
  })

  describe('createTicket', () => {
    it('debe crear un ticket correctamente', async () => {
      const dto = {
        subject: 'Problema con factura',
        message: 'No puedo ver mi última factura',
        priority: 'high' as const,
        projectId: 'project-1',
        projectName: 'Project One',
      }

      const result = await service.createTicket('user-1', 'user@test.com', dto)
      expect(result.id).toBe('ticket-id')
      expect(mockSet).toHaveBeenCalled()
    })

    it('debe rechazar si se excede la cuota', async () => {
      const dto = {
        subject: 'Otro ticket',
        message: 'Contenido',
        projectId: 'project-1',
        projectName: 'Project One',
      }

      // Configurar mock para simular que ya hay 5 tickets hoy
      mockCollectionGet.mockResolvedValueOnce({
        size: 5,
        forEach: (cb: (doc: any) => void) =>
          Array(5)
            .fill({ data: () => ({ createdAt: new Date() }) })
            .forEach(cb),
      })

      // mockDocGet para el project limit
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ monthlyTicketLimit: 3 }),
      })

      await expect(
        service.createTicket('user-1', 'user@test.com', dto),
      ).rejects.toThrow('Este proyecto ha alcanzado su límite')
    })
  })

  describe('updateTicket', () => {
    it('debe lanzar NotFoundException si no existe', async () => {
      mockDocGet.mockResolvedValue({ exists: false })

      await expect(
        service.updateTicket('invalid', {
          status: 'resolved',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('debe actualizar el estado del ticket', async () => {
      mockDocGet
        .mockResolvedValueOnce({ exists: true }) // exist check
        .mockResolvedValueOnce({
          data: () => ({
            id: 'ticket-123',
            status: 'resolved',
          }),
        })

      const result = await service.updateTicket('ticket-123', {
        status: 'resolved',
      })

      expect(result.status).toBe('resolved')
      expect(mockUpdate).toHaveBeenCalled()
    })
  })
})
