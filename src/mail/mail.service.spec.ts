import { MailService } from './mail.service'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../templates/template.service'
import { SystemConfigService } from '../system-config/system-config.service'
import { IMailProvider } from './interfaces/mail-provider.interface'

const sendMock = vi
  .fn()
  .mockResolvedValue({ success: true, messageId: 'test-id-123' })
const mockProvider: IMailProvider = {
  send: sendMock,
}

const mockConfigService = {
  get: vi.fn((key: string) => {
    const values: Record<string, string> = {
      RESEND_API_KEY: 're_test_key',
      MAIL_FROM_NOTIFY: 'Gabriel Zavando <no-reply@notify.gabrielzavando.cl>',
      MAIL_FROM_ADMIN:
        'Notificaciones <notificaciones@notify.gabrielzavando.cl>',
      MAIL_FROM_SUPPORT: 'Soporte <soporte@notify.gabrielzavando.cl>',
      MAIL_REPLY_TO_NOTIFY: 'contacto@gabrielzavando.cl',
      MAIL_REPLY_TO_ADMIN: 'contacto@gabrielzavando.cl',
      MAIL_REPLY_TO_SUPPORT: 'soporte@gabrielzavando.cl',
      MAIL_ADMIN_ADDRESS: 'contacto@gabrielzavando.cl',
    }
    return values[key] ?? ''
  }),
} satisfies Partial<ConfigService>

const mockTemplateService = {
  getEmailTemplate: vi.fn().mockResolvedValue('<html>Test</html>'),
} satisfies Partial<TemplateService>

const mockSystemConfigService = {
  getConfig: vi.fn().mockResolvedValue({ name: 'TestCompany' }),
} satisfies Partial<SystemConfigService>

describe('MailService', () => {
  let service: MailService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MailService(
      mockProvider,
      mockConfigService as unknown as ConfigService,
      mockTemplateService as unknown as TemplateService,
      mockSystemConfigService as unknown as SystemConfigService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('sendMail()', () => {
    it('should return true when provider succeeds', async () => {
      // Arrange
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      }

      // Act
      const result = await service.sendMail(options)

      // Assert
      expect(result).toBe(true)
      expect(sendMock).toHaveBeenCalledOnce()
    })

    it('should return false when provider fails', async () => {
      // Arrange
      sendMock.mockResolvedValueOnce({
        success: false,
        error: 'API error',
      })

      // Act
      const result = await service.sendMail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('sendMailDetailed()', () => {
    it('should use SUPPORT channel when account is SUPPORT', async () => {
      // Arrange & Act
      await service.sendMailDetailed({
        to: 'client@example.com',
        subject: 'Ticket reply',
        html: '<p>Response</p>',
        account: 'SUPPORT',
      })

      // Assert
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Soporte <soporte@notify.gabrielzavando.cl>',
          replyTo: 'soporte@gabrielzavando.cl',
        }),
      )
    })

    it('should use NOTIFY channel when account is CONTACT (alias)', async () => {
      // Arrange & Act
      await service.sendMailDetailed({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<p>Welcome</p>',
        account: 'CONTACT',
      })

      // Assert
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Gabriel Zavando <no-reply@notify.gabrielzavando.cl>',
          replyTo: 'contacto@gabrielzavando.cl',
        }),
      )
    })

    it('should return error details when provider fails', async () => {
      // Arrange
      sendMock.mockResolvedValueOnce({
        success: false,
        error: 'Rate limit exceeded',
      })

      // Act
      const result = await service.sendMailDetailed({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit exceeded')
    })
  })

  describe('testConnection()', () => {
    it('should return success when API key is present', () => {
      const result = service.testConnection()
      expect(result.success).toBe(true)
    })

    it('should return failure when API key is missing', () => {
      vi.mocked(mockConfigService.get).mockReturnValueOnce(undefined as never)
      const result = service.testConnection()
      expect(result.success).toBe(false)
    })
  })
})
