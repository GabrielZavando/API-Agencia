import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BlogCategoriesController } from './blog-categories.controller';
import { BlogCategoriesService } from './blog-categories.service';

describe('BlogCategoriesController', () => {
  let controller: BlogCategoriesController;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogCategoriesController],
      providers: [
        {
          provide: BlogCategoriesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BlogCategoriesController>(BlogCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
