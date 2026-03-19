import { ReportsService } from './reports.service'
import { FirebaseService } from '../firebase/firebase.service'
import { UsersService } from '../users/users.service'
import { NotificationsService } from '../notifications/notifications.service'
import { MailService } from '../mail/mail.service'

vi.mock('firebase-admin', () => ({
  firestore: vi.fn(() => ({
    collection: vi.fn().mockReturnThis(),
  })),
  storage: vi.fn(() => ({
    bucket: vi.fn().mockReturnThis(),
  })),
}))

describe('ReportsService', () => {
  let service: ReportsService
  let mockFirebaseService: any
  let mockUsersService: any
  let mockNotificationsService: any
  let mockMailService: any

  beforeEach(() => {
    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnThis(),
      }),
    }
    mockUsersService = {
      findOne: vi.fn(),
    }
    mockNotificationsService = {
      createNotification: vi.fn(),
    }
    mockMailService = {
      sendMail: vi.fn(),
    }

    service = new ReportsService(
      mockFirebaseService as FirebaseService,
      mockNotificationsService as NotificationsService,
      mockMailService as MailService,
      mockUsersService as UsersService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
