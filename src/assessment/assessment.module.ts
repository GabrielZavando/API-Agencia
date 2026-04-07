import { Module } from '@nestjs/common'
import { AssessmentController } from './assessment.controller'
import { AssessmentService } from './assessment.service'
import { PdfService } from './pdf.service'
import { ResolverService } from './resolver.service'
import { FirebaseModule } from '../firebase/firebase.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [FirebaseModule, MailModule],
  controllers: [AssessmentController],
  providers: [AssessmentService, PdfService, ResolverService],
})
export class AssessmentModule {}
