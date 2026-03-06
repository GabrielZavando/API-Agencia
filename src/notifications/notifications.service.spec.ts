import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from '../firebase/firebase.service';
import { NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Mock Firebase service
const mockFirebaseService = {};

// Mocks para la db de Firestore
const { mockDocRef, mockCollectionRef } = vi.hoisted(() => {
  const mockDocRef = {
    id: 'test-notification-id',
    set: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
  };

  const mockCollectionRef = {
    doc: vi.fn().mockReturnValue(mockDocRef),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn(),
  };

  return { mockDocRef, mockCollectionRef };
});

// Mock admin
vi.mock('firebase-admin', () => {
  return {
    default: {
      firestore: Object.assign(
        vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockCollectionRef),
        }),
        {
          FieldValue: {
            serverTimestamp: vi.fn(),
          },
        },
      ),
    },
    firestore: Object.assign(
      vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollectionRef),
      }),
      {
        FieldValue: {
          serverTimestamp: vi.fn(),
        },
      },
    ),
  };
});

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('debería crear y retornar una notificación (Arrange, Act, Assert)', async () => {
      // Arrange
      const dto = {
        title: 'Nuevo mensaje',
        message: 'Tienes una respuesta',
        userId: 'client123',
        link: '/support/123',
      };

      const firestoreInstance = admin.firestore();

      // Act
      const result = await service.createNotification(dto);

      // Assert
      expect(firestoreInstance.collection).toHaveBeenCalledWith(
        'notifications',
      );
      expect(mockCollectionRef.doc).toHaveBeenCalled();
      expect(mockDocRef.set).toHaveBeenCalledTimes(1);

      const args = mockDocRef.set.mock.calls[0][0];
      expect(args).toEqual(
        expect.objectContaining({
          id: 'test-notification-id',
          title: dto.title,
          message: dto.message,
          userId: dto.userId,
          link: dto.link,
          read: false,
        }),
      );
      expect(args.createdAt).toBeInstanceOf(Date);
      expect(result).toMatchObject({
        id: 'test-notification-id',
        title: dto.title,
      });
    });
  });

  describe('getUserNotifications', () => {
    it('debería obtener las notificaciones de un usuario (Arrange, Act, Assert)', async () => {
      // Arrange
      const userId = 'client123';
      const mockNotifData = {
        id: '1',
        title: 'T1',
        message: 'M1',
        userId,
        read: false,
        createdAt: new Date(),
      };

      const mockSnapshot = {
        docs: [{ data: () => mockNotifData }],
      };
      mockCollectionRef.get.mockResolvedValueOnce(mockSnapshot);

      // Act
      const result = await service.getUserNotifications(userId);

      // Assert
      expect(mockCollectionRef.where).toHaveBeenCalledWith(
        'userId',
        '==',
        userId,
      );
      expect(mockCollectionRef.orderBy).toHaveBeenCalledWith(
        'createdAt',
        'desc',
      );
      expect(mockCollectionRef.limit).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockNotifData);
    });
  });

  describe('markAsRead', () => {
    it('debería lanzar NotFoundException si no existe la notificación', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({ exists: false });

      // Act & Assert
      await expect(service.markAsRead('bad-id', 'client123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería lanzar NotFoundException si la notificación pertenece a otro usuario', async () => {
      // Arrange
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ userId: 'other-user' }),
      });

      // Act & Assert
      await expect(service.markAsRead('some-id', 'client123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería actualizar read a true y retornar la notificación actualizada (Arrange, Act, Assert)', async () => {
      // Arrange
      const mockNotifData = {
        id: 'some-id',
        title: 'T1',
        userId: 'client123',
        read: false,
      };
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => mockNotifData,
      });

      // Act
      const result = await service.markAsRead('some-id', 'client123');

      // Assert
      expect(mockDocRef.update).toHaveBeenCalledWith({ read: true });
      expect(result.read).toBe(true);
      expect(result.id).toBe(mockNotifData.id);
    });
  });
});
