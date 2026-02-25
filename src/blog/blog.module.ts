import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Module({
  controllers: [BlogController],
  providers: [BlogService, FirebaseAuthGuard],
})
export class BlogModule {}
