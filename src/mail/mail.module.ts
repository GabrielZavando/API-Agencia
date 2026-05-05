import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MailService } from './mail.service'
import { ResendMailProvider } from './providers/resend.provider'
import { MAIL_PROVIDER } from './interfaces/mail-provider.interface'
import { TemplatesModule } from '../templates/templates.module'
import { SystemConfigModule } from '../system-config/system-config.module'

@Module({
  imports: [ConfigModule, TemplatesModule, SystemConfigModule],
  providers: [
    /**
     * Para cambiar de proveedor en el futuro (ej: Amazon SES):
     * 1. Crear `providers/ses.provider.ts` implementando `IMailProvider`
     * 2. Cambiar `useClass: SesMailProvider` aquí
     * 3. Cero cambios en MailService ni en los consumidores
     */
    {
      provide: MAIL_PROVIDER,
      useClass: ResendMailProvider,
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
