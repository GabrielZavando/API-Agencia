import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ReportsController } from './reports.controller'

import { NotificationsModule } from '../notifications/notifications.module'
import { MailModule } from '../mail/mail.module'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [NotificationsModule, MailModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
