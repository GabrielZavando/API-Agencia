import { Module } from '@nestjs/common'
import { FormsController } from './forms.controller'
import { FormsService } from './forms.service'
import { FirebaseModule } from '../firebase/firebase.module'
import { MailModule } from '../mail/mail.module'
import { BlogModule } from '../blog/blog.module'
import { SystemConfigModule } from '../system-config/system-config.module'

@Module({
  imports: [FirebaseModule, MailModule, BlogModule, SystemConfigModule],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
