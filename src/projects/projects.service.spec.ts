import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { FirebaseService } from '../firebase/firebase.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockFirebaseService: { getDb: jest.Mock };
  let mockFirestore: { collection: jest.Mock };
  let mockCollection: {
    doc: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    get: jest.Mock;
  };
  let mockDocRef: {
    id: string;
    set: jest.Mock;
    get: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    mockDocRef = {
      id: 'test-project-id',
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockQuerySnapshot = {
      docs: [
        { data: () => ({ id: '1', name: 'Project 1', createdAt: new Date() }) },
        { data: () => ({ id: '2', name: 'Project 2', createdAt: new Date() }) },
      ],
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDocRef),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(mockQuerySnapshot),
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    mockFirebaseService = {
      getDb: jest.fn().mockReturnValue(mockFirestore),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project successfully', async () => {
      // Arrange
      const dto = {
        name: 'Test Project',
        clientId: 'client123',
        description: 'Desc',
        monthlyTicketLimit: 10,
      };

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toEqual('test-project-id');
      expect(result.name).toEqual('Test Project');
      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it('should throw an error if clientId is missing', async () => {
      // Arrange
      const dto = {
        name: 'Test Project',
        clientId: '',
        description: 'Desc',
        monthlyTicketLimit: 10,
      };

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if name is missing', async () => {
      // Arrange
      const dto = {
        name: '',
        clientId: 'client123',
        description: 'Desc',
        monthlyTicketLimit: 10,
      };

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByClient', () => {
    it('should return projects for a specific client', async () => {
      // Act
      const result = await service.findAllByClient('client123');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Project 1');
      expect(mockCollection.where).toHaveBeenCalledWith(
        'clientId',
        '==',
        'client123',
      );
    });
  });

  describe('findOne', () => {
    it('should return a project if it exists', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ id: 'test-project-id', name: 'Test Project' }),
      });

      // Act
      const result = await service.findOne('test-project-id');

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toEqual('Test Project');
    });

    it('should throw NotFoundException if project does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a project successfully', async () => {
      // Arrange
      const dto = { name: 'Updated name' };
      mockDocRef.get.mockResolvedValueOnce({ exists: true });
      mockDocRef.get.mockResolvedValueOnce({
        data: () => ({ id: 'test-project-id', name: 'Updated name' }),
      });

      // Act
      const result = await service.update('test-project-id', dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toEqual('Updated name');
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      // Act & Assert
      await expect(service.update('invalid-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a project successfully', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({ exists: true });

      // Act
      const result = await service.remove('test-project-id');

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      // Act & Assert
      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
