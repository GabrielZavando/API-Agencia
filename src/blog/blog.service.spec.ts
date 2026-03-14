import { BlogService } from './blog.service'
import { FirebaseService } from '../firebase/firebase.service'

vi.mock('firebase-admin', () => ({
  firestore: vi.fn(() => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
  })),
}))

describe('BlogService', () => {
  let service: BlogService
  let mockFirebaseService: any

  beforeEach(() => {
    mockFirebaseService = {
      getDb: vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnThis(),
        doc: vi.fn().mockReturnThis(),
      }),
    }
    service = new BlogService(mockFirebaseService as FirebaseService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
