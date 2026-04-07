import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { AuthRequest } from '../common/interfaces/auth.interface'
import { NotificationResponseDto } from './dto/notification-response.dto'

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @Req() req: AuthRequest,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsService.findAllByUser(
      req.user.uid,
    )
    return notifications as NotificationResponseDto[]
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string): Promise<{ success: boolean }> {
    return await this.notificationsService.markAsRead(id)
  }
}
