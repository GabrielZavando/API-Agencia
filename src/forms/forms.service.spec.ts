import { FormsService } from './forms.service'
import { FirebaseService } from '../firebase/firebase.service'
import { MailService } from '../mail/mail.service'

describe('FormsService', () => {
  let service: FormsService
  let firebaseService: Partial<FirebaseService>
  let mailService: Partial<MailService>

  beforeEach(() => {
    firebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnThis(),
        doc: vi.fn().mockReturnThis(),
      }),
    }
    mailService = {
      sendMail: vi.fn().mockResolvedValue(true),
    }

    service = new FormsService(
      firebaseService as FirebaseService,
      mailService as MailService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
