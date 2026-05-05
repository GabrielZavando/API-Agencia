import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ReportsController } from './reports.controller'

import { NotificationsModule } from '../notifications/notifications.module'
import { MailModule } from '../mail/mail.module'
import { UsersModule } from '../users/users.module'
import { TemplatesModule } from '../templates/templates.module'

@Module({
  imports: [NotificationsModule, MailModule, UsersModule, TemplatesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
