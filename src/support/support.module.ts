import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SupportService } from './support.service'
import { SupportController } from './support.controller'
import { MailModule } from '../mail/mail.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { TemplatesModule } from '../templates/templates.module'

@Module({
  imports: [ConfigModule, MailModule, NotificationsModule, TemplatesModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
