import { Module } from '@nestjs/common';
import { BlogCategoriesService } from './blog-categories.service';
import { BlogCategoriesController } from './blog-categories.controller';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Module({
  controllers: [BlogCategoriesController],
  providers: [BlogCategoriesService, FirebaseAuthGuard],
})
export class BlogCategoriesModule {}
