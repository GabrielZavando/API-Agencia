import { Test, TestingModule } from '@nestjs/testing'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IdeasService } from './ideas.service'
import { FirebaseService } from '../firebase/firebase.service'
import { UsersService } from '../users/users.service'
import { NotificationsService } from '../notifications/notifications.service'
import { NotFoundException } from '@nestjs/common'

describe('IdeasService', () => {
  let service: IdeasService
  let firebaseService: any
  let notificationsService: any
  let usersService: any

  const mockDb = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
    where: vi.fn().mockReturnThis(),
  }

  const mockStorage = {
    bucket: vi.fn().mockReturnThis(),
    file: vi.fn().mockReturnThis(),
  }

  beforeEach(async () => {
    firebaseService = {
      getDb: vi.fn().mockReturnValue(mockDb),
      getStorage: vi.fn().mockReturnValue(mockStorage),
    }

    notificationsService = {
      sendNotification: vi.fn(),
    }

    usersService = {
      findOne: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdeasService,
        { provide: FirebaseService, useValue: firebaseService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile()

    service = module.get<IdeasService>(IdeasService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOne', () => {
    it('should throw NotFoundException if idea does not exist', async () => {
      mockDb.get.mockResolvedValueOnce({ exists: false })

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      )
    })

    it('should return an enriched idea if it exists', async () => {
      const mockIdeaData = {
        name: 'Test Idea',
        explanation: 'Test Explanation',
        clientId: 'user123',
        createdAt: { toDate: () => new Date() },
      }

      mockDb.get.mockResolvedValueOnce({
        exists: true,
        id: 'idea123',
        data: () => mockIdeaData,
      })

      usersService.findOne.mockResolvedValueOnce({
        displayName: 'John Doe',
        email: 'john@example.com',
      })

      const result = await service.findOne('idea123')

      expect(result).toBeDefined()
      expect(result.id).toBe('idea123')
      expect(result.clientName).toBe('John Doe')
      expect(result.name).toBe('Test Idea')
    })
  })
})
