import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import {
  IMailProvider,
  MailSendPayload,
  MailSendResult,
} from '../interfaces/mail-provider.interface'

@Injectable()
export class ResendMailProvider implements IMailProvider, OnModuleInit {
  private readonly logger = new Logger(ResendMailProvider.name)
  private client: Resend

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')

    if (!apiKey) {
      this.logger.error(
        'RESEND_API_KEY no configurada. El servicio de correo no funcionará.',
      )
      return
    }

    this.client = new Resend(apiKey)
    this.logger.log('Resend inicializado correctamente.')
  }

  async send(payload: MailSendPayload): Promise<MailSendResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Resend no está inicializado (falta RESEND_API_KEY)',
      }
    }

    const { data, error } = await this.client.emails.send({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo,
      attachments: payload.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  }
}
