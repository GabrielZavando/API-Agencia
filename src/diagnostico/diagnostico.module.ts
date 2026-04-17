import { Module } from '@nestjs/common'
import { DiagnosticoController } from './diagnostico.controller'
import { DiagnosticoService } from './diagnostico.service'
import { PdfService } from './pdf.service'
import { ResolverService } from './resolver.service'
import { FirebaseModule } from '../firebase/firebase.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [FirebaseModule, MailModule],
  controllers: [DiagnosticoController],
  providers: [DiagnosticoService, PdfService, ResolverService],
})
export class DiagnosticoModule {}
