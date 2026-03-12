import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Req() req: { user: { uid: string } }) {
    // req.user.uid is provided by FirebaseAuthGuard
    return this.notificationsService.getUserNotifications(req.user.uid)
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Req() req: { user: { uid: string } },
  ) {
    return this.notificationsService.markAsRead(id, req.user.uid)
  }
}
