/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { ContactDto } from './dto/contact.dto';
import { SubscribeDto } from './dto/subscribe.dto';

describe('FormsController', () => {
  let controller: FormsController;
  let service: FormsService;

  const mockFormsService = {
    handleContact: jest.fn(),
    handleSubscribe: jest.fn(),
    handleUnsubscribe: jest.fn(),
    testFirebaseConnection: jest.fn(),
    testSMTPConnection: jest.fn(),
    getAllSubscribers: jest.fn(),
    getAllProspects: jest.fn(),
    adminReplyToProspect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [
        {
          provide: FormsService,
          useValue: mockFormsService,
        },
      ],
    }).compile();

    controller = module.get<FormsController>(FormsController);
    service = module.get<FormsService>(FormsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleContact', () => {
    it('should call formsService.handleContact and return the result', async () => {
      const mockDto: ContactDto = {
        name: 'Test',
        email: 'test@example.com',
        phone: '1234567',
        message: 'Hello',
        meta: { userAgent: 'test', page: 'test', ts: 'test' },
      };
      const expectedResult = { success: true, message: 'Formulario procesado' };

      mockFormsService.handleContact.mockResolvedValue(expectedResult);

      const result = await controller.handleContact(mockDto);

      expect(service.handleContact).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('handleSubscribe', () => {
    it('should call formsService.handleSubscribe and return the result', async () => {
      const mockDto: SubscribeDto = {
        email: 'test@example.com',
        meta: { userAgent: 'test', page: 'test', ts: 'test' },
      };
      const expectedResult = { success: true, message: 'Suscrito' };

      mockFormsService.handleSubscribe.mockResolvedValue(expectedResult);

      const result = await controller.handleSubscribe(mockDto);

      expect(service.handleSubscribe).toHaveBeenCalledWith(mockDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('handleUnsubscribe', () => {
    it('should call formsService.handleUnsubscribe and return the result', async () => {
      const email = 'test@example.com';
      const expectedResult = { success: true, message: 'Desuscrito' };

      mockFormsService.handleUnsubscribe.mockResolvedValue(expectedResult);

      const result = await controller.handleUnsubscribe(email);

      expect(service.handleUnsubscribe).toHaveBeenCalledWith(email);
      expect(result).toEqual(expectedResult);
    });
  });

  // Pruebas de los nuevos endpoints de admin
  describe('Admin Endpoints', () => {
    it('getSubscribers should call formsService.getAllSubscribers', async () => {
      const expectedResult = [{ email: 'test@example.com' }];
      mockFormsService.getAllSubscribers.mockResolvedValue(expectedResult);

      const result = await controller.getSubscribers();

      expect(service.getAllSubscribers).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('getProspects should call formsService.getAllProspects', async () => {
      const expectedResult = [{ name: 'Test' }];
      mockFormsService.getAllProspects.mockResolvedValue(expectedResult);

      const result = await controller.getProspects();

      expect(service.getAllProspects).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('adminReplyToProspect should call formsService.adminReplyToProspect', async () => {
      const id = 'prospect-1';
      const replyContent = 'Hola, esta es una prueba';
      const expectedResult = { success: true };
      mockFormsService.adminReplyToProspect.mockResolvedValue(expectedResult);

      const result = await controller.adminReplyToProspect(id, replyContent);

      expect(service.adminReplyToProspect).toHaveBeenCalledWith(
        id,
        replyContent,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
