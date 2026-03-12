import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { BlogCategoriesService } from './blog-categories.service'
import { FirebaseService } from '../firebase/firebase.service'

describe('BlogCategoriesService', () => {
  let service: BlogCategoriesService

  const mockFirebaseService = {
    // mock methods
  }

  beforeEach(async () => {
    // Mock admin.firestore
    vi.mock('firebase-admin', () => ({
      firestore: () => ({
        collection: vi.fn(),
      }),
    }))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogCategoriesService,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile()

    service = module.get<BlogCategoriesService>(BlogCategoriesService)
  })

  it('should be defined', () => {
    // Arrange
    const definedService = service

    // Act & Assert
    expect(definedService).toBeDefined()
  })
})
