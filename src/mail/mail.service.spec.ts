import { MailService } from './mail.service'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../templates/template.service'

describe('MailService', () => {
  let service: MailService
  let mockConfigService: Partial<ConfigService>
  let mockTemplateService: Partial<TemplateService>

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'SMTP_PORT') return '465'
        return ''
      }),
    }
    mockTemplateService = {
      getEmailTemplate: vi.fn().mockResolvedValue('<html></html>'),
    }

    service = new MailService(
      mockConfigService as ConfigService,
      mockTemplateService as TemplateService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
