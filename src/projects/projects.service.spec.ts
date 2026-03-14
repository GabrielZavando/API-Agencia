import { ProjectsService } from './projects.service'
import { FirebaseService } from '../firebase/firebase.service'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('ProjectsService', () => {
  let service: ProjectsService
  let mockFirebaseService: any
  let mockFirestore: any
  let mockCollection: any
  let mockDocRef: any

  beforeEach(() => {
    mockDocRef = {
      id: 'test-project-id',
      set: vi.fn().mockResolvedValue(true),
      get: vi.fn(),
      update: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true),
    }

    const mockQuerySnapshot = {
      docs: [
        { data: () => ({ id: '1', name: 'Project 1', createdAt: new Date() }) },
        { data: () => ({ id: '2', name: 'Project 2', createdAt: new Date() }) },
      ],
    }

    mockCollection = {
      doc: vi.fn().mockReturnValue(mockDocRef),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(mockQuerySnapshot),
    }

    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollection),
    }

    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue(mockFirestore),
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
      expect(mockDocRef.set).toHaveBeenCalled()
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
      expect(mockCollection.where).toHaveBeenCalledWith(
        'clientId',
        '==',
        'client123',
      )
    })
  })

  describe('findOne', () => {
    it('should return a project if it exists', async () => {
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: 'test-project-id', name: 'Test Project' }),
      })
      const result = await service.findOne('test-project-id')
      expect(result).toBeDefined()
      expect(result.name).toEqual('Test Project')
    })

    it('should throw NotFoundException if project does not exist', async () => {
      mockDocRef.get.mockResolvedValueOnce({ exists: false })
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('update', () => {
    it('should update a project successfully', async () => {
      const dto = { name: 'Updated name' }
      mockDocRef.get.mockResolvedValueOnce({ exists: true })
      mockDocRef.get.mockResolvedValueOnce({
        data: () => ({ id: 'test-project-id', name: 'Updated name' }),
      })
      const result = await service.update('test-project-id', dto)
      expect(result).toBeDefined()
      expect(result.name).toEqual('Updated name')
      expect(mockDocRef.update).toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should delete a project successfully', async () => {
      mockDocRef.get.mockResolvedValueOnce({ exists: true })
      const result = await service.remove('test-project-id')
      expect(result).toEqual({ success: true })
      expect(mockDocRef.delete).toHaveBeenCalled()
    })
  })
})
