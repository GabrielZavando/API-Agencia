import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [TemplatesModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
