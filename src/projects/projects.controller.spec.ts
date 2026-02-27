import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthenticatedRequest } from '../auth/firebase-auth.guard';
import { vi } from 'vitest';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let mockProjectsService: any;

  beforeEach(async () => {
    mockProjectsService = {
      create: vi.fn(),
      findAllByClient: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      // Arrange
      const dto: CreateProjectDto = { name: 'Test', clientId: 'client1' };
      const expectedResult = { id: '1', ...dto };
      mockProjectsService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(dto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProjectsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findMyProjects', () => {
    it('should find projects for the current authenticated user', async () => {
      // Arrange
      const req = {
        user: { uid: 'client1' },
      } as unknown as AuthenticatedRequest;
      const expectedResult = [{ id: '1', name: 'Test', clientId: 'client1' }];
      mockProjectsService.findAllByClient.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findMyProjects(req);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProjectsService.findAllByClient).toHaveBeenCalledWith(
        'client1',
      );
    });
  });

  describe('findAllByClient', () => {
    it('should find projects for a specific client id', async () => {
      // Arrange
      const clientId = 'client1';
      const expectedResult = [{ id: '1', name: 'Test', clientId }];
      mockProjectsService.findAllByClient.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAllByClient(clientId);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProjectsService.findAllByClient).toHaveBeenCalledWith(
        clientId,
      );
    });
  });

  describe('findOne', () => {
    it('should find a single project by id', async () => {
      // Arrange
      const id = '1';
      const expectedResult = { id, name: 'Test', clientId: 'client1' };
      mockProjectsService.findOne.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProjectsService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      // Arrange
      const id = '1';
      const dto: UpdateProjectDto = { name: 'Updated' };
      const expectedResult = { id, name: 'Updated', clientId: 'client1' };
      mockProjectsService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(id, dto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProjectsService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      // Arrange
      const id = '1';
      const expectedResult = { success: true };
      mockProjectsService.remove.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.remove(id);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockProjectsService.remove).toHaveBeenCalledWith(id);
    });
  });
});
