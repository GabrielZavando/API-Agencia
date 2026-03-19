import { FormsService } from './forms.service'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'
import { ConfigService } from '@nestjs/config'

describe('FormsService', () => {
  let service: FormsService
  let firebaseService: Partial<FirebaseService>
  let mailService: Partial<MailService>
  let configService: Partial<ConfigService>

  beforeEach(() => {
    firebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnThis(),
        doc: vi.fn().mockReturnThis(),
      }),
      findProspectByEmail: vi.fn(),
      createProspectWithConversation: vi.fn(),
      addConversationToProspect: vi.fn(),
      markEmailAsSent: vi.fn(),
    }
    mailService = {
      sendMail: vi.fn().mockResolvedValue(true),
    }
    configService = {
      get: vi.fn().mockReturnValue('mock-value'),
    }

    service = new FormsService(
      firebaseService as FirebaseService,
      mailService as MailService,
      configService as ConfigService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
