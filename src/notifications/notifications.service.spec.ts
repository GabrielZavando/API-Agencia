import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsService } from './notifications.service'
import { FirebaseService } from '../firebase/firebase.service'
import { NotFoundException } from '@nestjs/common'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Importar mocks centralizados
import {
  mockDoc,
  mockDocGet,
  mockCollection,
  mockCollectionGet,
  mockAdd,
  mockUpdate,
} from '../../test/mocks/firebase-admin'

describe('NotificationsService', () => {
  let service: NotificationsService

  beforeEach(async () => {
    vi.clearAllMocks()

    // Configurar comportamiento por defecto de los mocks para este servicio
    mockDoc.mockReturnValue({
      id: 'test-notification-id',
      get: mockDocGet,
      set: vi.fn().mockResolvedValue(true),
      update: mockUpdate,
      delete: vi.fn().mockResolvedValue(true),
      collection: vi.fn().mockReturnThis(),
    })

    mockCollection.mockReturnValue({
      doc: mockDoc,
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: mockCollectionGet,
      add: mockAdd.mockResolvedValue({ id: 'test-notification-id' }),
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: FirebaseService,
          useValue: {
            getDb: vi.fn(() => ({
              collection: mockCollection,
              batch: vi.fn().mockReturnValue({
                update: vi.fn(),
                commit: vi.fn().mockResolvedValue(true),
              }),
            })),
          },
        },
      ],
    }).compile()

    service = module.get<NotificationsService>(NotificationsService)
  })

  it('debe estar definido', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('debería crear y retornar una notificación', async () => {
      const userId = 'client123'
      const title = 'Nuevo mensaje'
      const message = 'Tienes una respuesta'
      const type = 'info'
      const link = '/support/123'

      const result = await service.create(userId, title, message, type, link)

      expect(mockCollection).toHaveBeenCalledWith('notifications')
      expect(mockAdd).toHaveBeenCalledTimes(1)
      expect(result.id).toBe('test-notification-id')
      expect(result.title).toBe(title)
    })
  })

  describe('findAllByUser', () => {
    it('debería obtener las notificaciones de un usuario', async () => {
      const userId = 'client123'
      const mockNotifData = {
        title: 'T1',
        message: 'M1',
        userId,
        read: false,
        createdAt: new Date(),
      }

      mockCollectionGet.mockResolvedValueOnce({
        docs: [{ id: '1', data: () => mockNotifData }],
        forEach: (
          cb: (
            doc: { id: string; data: () => typeof mockNotifData },
            index: number,
          ) => void,
        ) => [{ id: '1', data: () => mockNotifData }].forEach(cb),
      })

      const result = await service.findAllByUser(userId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
      expect(result[0].title).toBe('T1')
    })
  })

  describe('markAsRead', () => {
    it('debería lanzar NotFoundException si no existe la notificación', async () => {
      mockDocGet.mockResolvedValueOnce({ exists: false })

      await expect(service.markAsRead('bad-id')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('debería actualizar read a true y retornar éxito', async () => {
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: 'some-id', read: false }),
      })

      const result = await service.markAsRead('some-id')

      expect(mockUpdate).toHaveBeenCalledWith({ read: true })
      expect(result.success).toBe(true)
    })
  })
})
