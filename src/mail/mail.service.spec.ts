import { Test, TestingModule } from '@nestjs/testing'
import { MailService } from './mail.service'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../templates/template.service'

describe('MailService', () => {
  let service: MailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue(''),
          },
        },
        {
          provide: TemplateService,
          useValue: {
            getEmailTemplate: vi.fn().mockResolvedValue('<html></html>'),
          },
        },
      ],
    }).compile()

    service = module.get<MailService>(MailService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
