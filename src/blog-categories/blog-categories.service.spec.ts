import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { BlogCategoriesService } from './blog-categories.service'
import { FirebaseService } from '../firebase/firebase.service'

// Importar mocks centralizados
import { mockCollection } from '../../test/mocks/firebase-admin'

describe('BlogCategoriesService', () => {
  let service: BlogCategoriesService

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogCategoriesService,
        {
          provide: FirebaseService,
          useValue: {
            getDb: vi.fn(() => ({
              collection: mockCollection,
            })),
          },
        },
      ],
    }).compile()

    service = module.get<BlogCategoriesService>(BlogCategoriesService)
  })

  it('debe estar definido', () => {
    expect(service).toBeDefined()
  })
})
