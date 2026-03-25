import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'

import { SystemConfigService } from './system-config.service'
import { UpdateSystemConfigDto } from './dto/update-config.dto'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  async getConfig() {
    return await this.configService.getConfig()
  }

  @Put()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin', 'superadmin')
  async updateConfig(@Body() dto: UpdateSystemConfigDto) {
    return await this.configService.updateConfig(dto)
  }
}
