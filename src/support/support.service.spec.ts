import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail/mail.service';

// Mock firebase-admin
const mockDoc = jest.fn();
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
    })),
  })),
}));

describe('SupportService', () => {
  let service: SupportService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDoc.mockReturnValue({
      id: 'ticket-123',
      set: mockSet,
      get: mockGet,
      update: mockUpdate,
    });

    // Default: usuario sin campo monthlyTicketLimit
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({}),
    });

    // Mock de where().get() para cuota
    const fakeWhere = jest.fn();
    const whereChain = {
      where: fakeWhere,
      get: jest.fn().mockResolvedValue({
        size: 0,
        docs: [],
        forEach: jest.fn((cb: any) => [].forEach(cb)),
      }),
    };
    fakeWhere.mockReturnValue(whereChain);
    mockWhere.mockReturnValue(whereChain);

    mockOrderBy.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        docs: [],
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: FirebaseService,
          useValue: {
            db: {
              collection: jest.fn(() => ({
                doc: mockDoc,
                where: mockWhere,
                orderBy: mockOrderBy,
              })),
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: 'ConfigService',
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getTicketQuota', () => {
    it('debe retornar límite por defecto de 2', async () => {
      const quota = await service.getTicketQuota('user-1');

      expect(quota.limit).toBe(2);
      expect(quota.used).toBe(0);
      expect(quota.remaining).toBe(2);
    });

    it('debe usar el límite personalizado del usuario', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ monthlyTicketLimit: 5 }),
      });

      const quota = await service.getTicketQuota('user-1');

      expect(quota.limit).toBe(5);
      expect(quota.remaining).toBe(5);
    });
  });

  describe('createTicket', () => {
    it('debe crear un ticket correctamente', async () => {
      mockSet.mockResolvedValue(undefined);

      const dto = {
        subject: 'Problema con factura',
        message: 'No puedo ver mi última factura',
        priority: 'high' as const,
        projectId: 'project-1',
        projectName: 'Project One',
      };

      const result = await service.createTicket('user-1', 'user@test.com', dto);

      expect(result.id).toBe('ticket-123');
      expect(result.subject).toBe('Problema con factura');
      expect(result.status).toBe('open');
      expect(result.priority).toBe('high');
      expect(result.projectId).toBe('project-1');
      expect(mockSet).toHaveBeenCalled();
    });

    it('debe rechazar si se excede la cuota', async () => {
      // Simular que ya usó 2 tickets
      const fakeWhere = jest.fn();
      const whereChain = {
        where: fakeWhere,
        get: jest.fn().mockResolvedValue({
          size: 2,
          docs: [{}, {}],
          forEach: jest.fn((cb) =>
            [
              { data: () => ({ createdAt: new Date() }) },
              { data: () => ({ createdAt: new Date() }) },
            ].forEach(cb),
          ),
        }),
      };
      fakeWhere.mockReturnValue(whereChain);
      mockWhere.mockReturnValue(whereChain);

      const dto = {
        subject: 'Otro ticket',
        message: 'Contenido',
        projectId: 'project-1',
        projectName: 'Project One',
      };

      await expect(
        service.createTicket('user-1', 'user@test.com', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTicket', () => {
    it('debe lanzar NotFoundException si no existe', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(
        service.updateTicket('invalid', {
          status: 'resolved',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe actualizar el estado del ticket', async () => {
      mockGet.mockResolvedValueOnce({ exists: true }).mockResolvedValueOnce({
        data: () => ({
          id: 'ticket-123',
          status: 'resolved',
          adminResponse: 'Resuelto',
        }),
      });

      mockUpdate.mockResolvedValue(undefined);

      const result = await service.updateTicket('ticket-123', {
        status: 'resolved',
        adminResponse: 'Resuelto',
      });

      expect(result.status).toBe('resolved');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
