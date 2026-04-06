import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { SystemConfigService } from './system-config.service'
import { UpdateSystemConfigDto } from './dto/update-config.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { SystemConfigResponseDto } from './dto/system-config-response.dto'

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  async getConfig(): Promise<SystemConfigResponseDto> {
    return this.configService.getConfig()
  }

  @Patch()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin', 'superadmin')
  async updateConfig(
    @Body() dto: UpdateSystemConfigDto,
  ): Promise<SystemConfigResponseDto> {
    return this.configService.updateConfig(dto)
  }
}
