import { Module } from '@nestjs/common'
import { IdeasController } from './ideas.controller'
import { IdeasService } from './ideas.service'
import { NotificationsModule } from '../notifications/notifications.module'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [NotificationsModule, UsersModule],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
