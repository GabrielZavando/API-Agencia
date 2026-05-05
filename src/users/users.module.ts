import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { MailModule } from '../mail/mail.module'
import { TemplatesModule } from '../templates/templates.module'

@Module({
  imports: [MailModule, TemplatesModule],
  controllers: [UsersController],
  providers: [UsersService, FirebaseAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
