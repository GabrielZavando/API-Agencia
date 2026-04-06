import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { TemplatesModule } from '../templates/templates.module'
import { SystemConfigModule } from '../system-config/system-config.module'

@Module({
  imports: [TemplatesModule, SystemConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
