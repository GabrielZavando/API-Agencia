import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock firebase-admin
const mockDoc = jest.fn();
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDelete = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockSave = jest.fn();
const mockFile = jest.fn();
const mockGetSignedUrl = jest.fn();
const mockBucketFile = jest.fn();

jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
    })),
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: mockBucketFile,
    })),
  })),
}));

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDoc.mockReturnValue({
      id: 'report-123',
      set: mockSet,
      get: mockGet,
    });

    mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
    });

    mockOrderBy.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        docs: [],
      }),
    });

    mockBucketFile.mockReturnValue({
      save: mockSave,
      getSignedUrl: mockGetSignedUrl,
      delete: jest.fn().mockResolvedValue(undefined),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('uploadReport', () => {
    it('debe rechazar archivos que no son PDF', async () => {
      const file = {
        mimetype: 'image/png',
        buffer: Buffer.from('fake'),
        originalname: 'test.png',
        size: 100,
      } as Express.Multer.File;

      const dto = {
        clientId: 'client-1',
        title: 'Informe Test',
      };

      await expect(service.uploadReport(file, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe subir un PDF correctamente', async () => {
      mockSet.mockResolvedValue(undefined);
      mockSave.mockResolvedValue(undefined);

      const file = {
        mimetype: 'application/pdf',
        buffer: Buffer.from('fake-pdf'),
        originalname: 'informe.pdf',
        size: 1024,
      } as Express.Multer.File;

      const dto = {
        clientId: 'client-1',
        title: 'Informe Mensual',
        description: 'Descripción del informe',
      };

      const result = await service.uploadReport(file, dto);

      expect(result.id).toBe('report-123');
      expect(result.clientId).toBe('client-1');
      expect(result.title).toBe('Informe Mensual');
      expect(result.fileName).toBe('informe.pdf');
      expect(mockSave).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('getDownloadUrl', () => {
    it('debe lanzar NotFoundException si no existe', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(service.getDownloadUrl('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe retornar una URL firmada', async () => {
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          storagePath: 'reports/c1/r1.pdf',
          fileName: 'informe.pdf',
        }),
      });

      mockGetSignedUrl.mockResolvedValue([
        'https://storage.example.com/signed-url',
      ]);

      const result = await service.getDownloadUrl('report-123');

      expect(result.url).toBe('https://storage.example.com/signed-url');
      expect(result.fileName).toBe('informe.pdf');
    });
  });

  describe('deleteReport', () => {
    it('debe lanzar NotFoundException si no existe', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await expect(service.deleteReport('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
