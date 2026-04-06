import { ProjectsService } from './projects.service'
import { FirebaseService } from '../firebase/firebase.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'

import {
  mockDoc,
  mockDocGet,
  mockAdd,
  mockWhere,
  mockOrderBy,
  mockSet,
  mockUpdate,
  mockDelete,
  mockCollection,
  mockCollectionGet,
} from '../../test/mocks/firebase-admin'

describe('ProjectsService', () => {
  let service: ProjectsService
  let mockFirebaseService: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Configuración base de mockDoc para que devuelva docRef correctamente
    mockDoc.mockReturnValue({
      id: 'test-project-id',
      set: mockSet.mockResolvedValue(true),
      get: mockDocGet.mockResolvedValue({
        exists: true,
        id: 'test-project-id',
        data: () => ({ id: 'test-project-id', name: 'Test Project' }),
      }),
      update: mockUpdate.mockResolvedValue(true),
      delete: mockDelete.mockResolvedValue(true),
      collection: vi.fn(),
    })

    const date1 = new Date('2024-01-01T11:00:00Z')
    const date2 = new Date('2024-01-01T10:00:00Z')

    // Mock de query snapshot para findAllByClient
    const mockQuerySnapshot = {
      docs: [
        {
          id: '1',
          data: () => ({ id: '1', name: 'Project 1', createdAt: date1 }),
        },
        {
          id: '2',
          data: () => ({ id: '2', name: 'Project 2', createdAt: date2 }),
        },
      ],
      forEach: vi.fn((cb: (doc: any) => void) =>
        [
          {
            id: '1',
            data: () => ({ id: '1', name: 'Project 1', createdAt: date1 }),
          },
          {
            id: '2',
            data: () => ({ id: '2', name: 'Project 2', createdAt: date2 }),
          },
        ].forEach(cb),
      ),
    }

    mockCollection.mockReturnValue({
      doc: mockDoc,
      where: mockWhere.mockReturnThis(),
      orderBy: mockOrderBy.mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: mockCollectionGet.mockResolvedValue(mockQuerySnapshot),
      add: mockAdd.mockResolvedValue({ id: 'new-project-id' }),
    })

    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: mockCollection,
      }),
    }

    service = new ProjectsService(mockFirebaseService as FirebaseService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a new project successfully', async () => {
      const dto = {
        name: 'Test Project',
        clientId: 'client123',
        description: 'Desc',
        monthlyTicketLimit: 10,
      }
      const result = await service.create(dto)
      expect(result).toBeDefined()
      expect(result.id).toEqual('test-project-id')
      expect(result.name).toEqual('Test Project')
      expect(mockSet).toHaveBeenCalled()
    })

    it('should throw an error if clientId is missing', async () => {
      const dto = {
        name: 'Test Project',
        clientId: '',
        description: 'Desc',
        monthlyTicketLimit: 10,
      }
      await expect(service.create(dto)).rejects.toThrow(BadRequestException)
    })

    it('should throw an error if name is missing', async () => {
      const dto = {
        name: '',
        clientId: 'client123',
        description: 'Desc',
        monthlyTicketLimit: 10,
      }
      await expect(service.create(dto)).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAllByClient', () => {
    it('should return projects for a specific client', async () => {
      const result = await service.findAllByClient('client123')
      expect(result).toHaveLength(2)
      expect(result[0].name).toEqual('Project 1')
      expect(mockWhere).toHaveBeenCalledWith('clientId', '==', 'client123')
    })
  })

  describe('findOne', () => {
    it('should return a project if it exists', async () => {
      mockDocGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: 'test-project-id', name: 'Test Project' }),
      })
      const result = await service.findOne('test-project-id')
      expect(result).toBeDefined()
      expect(result.name).toEqual('Test Project')
    })

    it('should throw NotFoundException if project does not exist', async () => {
      mockDocGet.mockResolvedValueOnce({ exists: false })
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    it('should update a project successfully', async () => {
      const dto = { name: 'Updated name' }
      mockDocGet.mockResolvedValueOnce({ exists: true })
      mockDocGet.mockResolvedValueOnce({
        data: () => ({ id: 'test-project-id', name: 'Updated name' }),
      })
      const result = await service.update('test-project-id', dto)
      expect(result).toBeDefined()
      expect(result.name).toEqual('Updated name')
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should delete a project successfully', async () => {
      mockDocGet.mockResolvedValueOnce({ exists: true })
      const result = await service.remove('test-project-id')
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
