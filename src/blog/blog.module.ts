import { Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { BlogService } from './blog.service'
import { BlogController } from './blog.controller'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'

@Module({
  imports: [
    CacheModule.register({
      ttl: 60_000, // 60 segundos en ms
      max: 100, // máximo 100 entradas en memoria
    }),
  ],
  controllers: [BlogController],
  providers: [BlogService, FirebaseAuthGuard],
  exports: [BlogService],
})
export class BlogModule {}
