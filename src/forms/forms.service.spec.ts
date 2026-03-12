import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { FormsService } from './forms.service'
import { FirebaseService, ProspectRecord } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'

describe('FormsService', () => {
  let service: FormsService
  let firebaseService: Partial<FirebaseService>
  let mailService: Partial<MailService>
  let configService: Partial<ConfigService>

  beforeEach(async () => {
    firebaseService = {
      getAllProspects: jest.fn(),
      getAllSubscribers: jest.fn(),
      addAdminReplyToProspect: jest.fn(),
      getDb: jest.fn(),
      markEmailAsSent: jest.fn(),
    }

    mailService = {
      sendMail: jest.fn(),
    }

    configService = {
      get: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: FirebaseService, useValue: firebaseService },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile()

    service = module.get<FormsService>(FormsService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getAllProspects', () => {
    it('should return a list of prospects', async () => {
      const prospects = [{ prospectId: '1', name: 'Test' }] as ProspectRecord[]
      ;(firebaseService.getAllProspects as any).mockResolvedValue(prospects)
      const result = await service.getAllProspects()
      expect(firebaseService.getAllProspects).toHaveBeenCalled()
      expect(result).toEqual(prospects)
    })
  })

  describe('getAllSubscribers', () => {
    it('should return a list of subscribers', async () => {
      const subscribers = [{ subscriberId: '1', email: 'test@example.com' }]
      ;(firebaseService.getAllSubscribers as any).mockResolvedValue(subscribers)
      const result = await service.getAllSubscribers()
      expect(firebaseService.getAllSubscribers).toHaveBeenCalled()
      expect(result).toEqual(subscribers)
    })
  })

  describe('adminReplyToProspect', () => {
    it('should reply successfully and mark email as sent', async () => {
      const prospectId = 'prospect-123'
      const replyContent = 'Admin reply'
      const conversationId = 'conv-456'

      const prospectData = {
        name: 'Jon',
        email: 'jon@example.com',
        phone: '123456789',
      } as ProspectRecord

      // Mockear la respuesta de guardado
      ;(firebaseService.addAdminReplyToProspect as any).mockResolvedValue(
        conversationId,
      )

      // Mockear Firestore getDb
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => prospectData,
      })
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet })
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc })
      ;(firebaseService.getDb as any).mockReturnValue({
        collection: mockCollection,
      })

      // Mockear envío de Mail
      ;(mailService.sendMail as any).mockResolvedValue(true)

      const result = await service.adminReplyToProspect(
        prospectId,
        replyContent,
      )

      expect(firebaseService.addAdminReplyToProspect).toHaveBeenCalledWith(
        prospectId,
        replyContent,
      )
      expect(firebaseService.getDb).toHaveBeenCalled()
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jon@example.com',
          templateName: 'returning-prospect',
        }),
      )
      expect(firebaseService.markEmailAsSent).toHaveBeenCalledWith(
        prospectId,
        conversationId,
      )
      expect(result).toEqual({
        success: true,
        message: 'Respuesta enviada correctamente',
        conversationId,
        emailSent: true,
      })
    })

    it('should return error if prospect not found', async () => {
      const prospectId = 'prospect-no'
      const replyContent = 'Admin reply'
      const conversationId = 'conv-456'

      // Mockear la respuesta de guardado
      ;(firebaseService.addAdminReplyToProspect as any).mockResolvedValue(
        conversationId,
      )

      // Mockear Firestore getDb - false
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      })
      const mockDoc = jest.fn().mockReturnValue({ get: mockGet })
      const mockCollection = jest.fn().mockReturnValue({ doc: mockDoc })
      ;(firebaseService.getDb as any).mockReturnValue({
        collection: mockCollection,
      })

      const result = await service.adminReplyToProspect(
        prospectId,
        replyContent,
      )

      expect(firebaseService.addAdminReplyToProspect).toHaveBeenCalledWith(
        prospectId,
        replyContent,
      )
      expect(mailService.sendMail).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.message).toBe('Error enviando respuesta de administrador')
    })
  })
})
