import { BlogService } from './blog.service'
import { FirebaseService } from '../firebase/firebase.service'
import { Cache } from '@nestjs/cache-manager'

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
    service = new BlogService(
      mockFirebaseService as FirebaseService,
      {} as unknown as Cache, // Cache Manager
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
