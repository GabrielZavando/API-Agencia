import { ReportsService } from './reports.service'
import { FirebaseService } from '../firebase/firebase.service'
import { UsersService } from '../users/users.service'

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

  beforeEach(() => {
    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnThis(),
      }),
    }
    mockUsersService = {}

    service = new ReportsService(
      mockFirebaseService as FirebaseService,
      mockUsersService as UsersService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
