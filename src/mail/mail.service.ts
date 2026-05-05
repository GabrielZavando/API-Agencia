import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../templates/template.service'
import { SystemConfigService } from '../system-config/system-config.service'
import { companyConfig } from '../config/company.config'
import {
  IMailProvider,
  MAIL_PROVIDER,
} from './interfaces/mail-provider.interface'
import { MailAccount, MailOptions } from './interfaces/mail.interface'

/**
 * Configuración de un canal de envío.
 * - from: remitente visible en el cliente de correo
 * - replyTo: dirección real a la que el destinatario puede responder
 */
interface ChannelConfig {
  from: string
  replyTo: string
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private channels: Map<MailAccount, ChannelConfig> = new Map()

  constructor(
    @Inject(MAIL_PROVIDER) private readonly provider: IMailProvider,
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    this.initializeChannels()
  }

  // ─── Configuración de canales ────────────────────────────────────────────

  private initializeChannels() {
    const get = (key: string, fallback: string) =>
      this.configService.get<string>(key) || fallback

    // Canal por defecto: correos al usuario final
    const notifyChannel: ChannelConfig = {
      from: get(
        'MAIL_FROM_NOTIFY',
        `Gabriel Zavando <no-reply@notify.gabrielzavando.cl>`,
      ),
      replyTo: get('MAIL_REPLY_TO_NOTIFY', 'contacto@gabrielzavando.cl'),
    }

    // Canal admin: alertas internas
    const adminChannel: ChannelConfig = {
      from: get(
        'MAIL_FROM_ADMIN',
        `Notificaciones <notificaciones@notify.gabrielzavando.cl>`,
      ),
      replyTo: get('MAIL_REPLY_TO_ADMIN', 'contacto@gabrielzavando.cl'),
    }

    // Canal soporte: tickets e informes
    const supportChannel: ChannelConfig = {
      from: get(
        'MAIL_FROM_SUPPORT',
        `Soporte Gabriel Zavando <soporte@notify.gabrielzavando.cl>`,
      ),
      replyTo: get('MAIL_REPLY_TO_SUPPORT', 'soporte@gabrielzavando.cl'),
    }

    this.channels.set('NOTIFY', notifyChannel)
    this.channels.set('CONTACT', notifyChannel) // alias de compatibilidad
    this.channels.set('ADMIN', adminChannel)
    this.channels.set('SUPPORT', supportChannel)

    this.logger.log('Canales de email inicializados.')
  }

  private resolveChannel(account: MailAccount = 'NOTIFY'): ChannelConfig {
    return (
      this.channels.get(account) ??
      (this.channels.get('NOTIFY') as ChannelConfig)
    )
  }

  // ─── Variables base para plantillas ──────────────────────────────────────

  getBaseVariables(email: string): Record<string, unknown> {
    const websiteUrl = companyConfig.websiteUrl
    return {
      siteName: companyConfig.name,
      name: companyConfig.name,
      companyName: companyConfig.name,
      websiteUrl,
      logoUrl: companyConfig.logoUrl,
      address: companyConfig.address,
      phone: companyConfig.phone,
      email: companyConfig.email,
      servicesUrl: companyConfig.servicesUrl,
      calendlyUrl: companyConfig.calendlyUrl,
      blogUrl: companyConfig.blogUrl,
      linkedinUrl: companyConfig.social.linkedinUrl,
      linkedinIconUrl: companyConfig.social.linkedinIconUrl,
      instagramUrl: companyConfig.social.instagramUrl,
      instagramIconUrl: companyConfig.social.instagramIconUrl,
      githubUrl: companyConfig.social.githubUrl,
      githubIconUrl: companyConfig.social.githubIconUrl,
      youtubeUrl: companyConfig.social.youtubeUrl,
      youtubeIconUrl: companyConfig.social.youtubeIconUrl,
      social: {
        linkedinUrl: companyConfig.social.linkedinUrl,
        linkedinIconUrl: companyConfig.social.linkedinIconUrl,
        instagramUrl: companyConfig.social.instagramUrl,
        instagramIconUrl: companyConfig.social.instagramIconUrl,
        githubUrl: companyConfig.social.githubUrl,
        githubIconUrl: companyConfig.social.githubIconUrl,
        youtubeUrl: companyConfig.social.youtubeUrl,
        youtubeIconUrl: companyConfig.social.youtubeIconUrl,
      },
      unsubscribeUrl: `${websiteUrl}/unsubscribe?email=${email}`,
      currentYear: new Date().getFullYear().toString(),
    }
  }

  // ─── API pública ─────────────────────────────────────────────────────────

  /**
   * Envía un correo y retorna true/false.
   * Mantiene la firma original para no romper los call sites existentes.
   */
  async sendMail(options: MailOptions): Promise<boolean> {
    const result = await this.sendMailDetailed(options)
    return result.success
  }

  /**
   * Envía un correo y retorna detalles del resultado.
   * Mantiene la firma original para no romper los call sites existentes.
   */
  async sendMailDetailed(
    options: MailOptions,
  ): Promise<{ success: boolean; error?: string; data?: unknown }> {
    const account = options.account ?? 'NOTIFY'
    const channel = this.resolveChannel(account)

    try {
      // Construir HTML final (desde plantilla o directo)
      const html = options.html ?? ''

      // Display name del from puede personalizarse si se pasa `options.from`
      const from = options.from ?? channel.from
      const replyTo = options.replyTo ?? channel.replyTo

      const result = await this.provider.send({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html,
        replyTo,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      })

      if (!result.success) {
        throw new Error(result.error ?? 'Error desconocido del proveedor')
      }

      this.logger.log(
        `[${account}] Email enviado → ${options.to} | ID: ${result.messageId}`,
      )

      return { success: true, data: { id: result.messageId } }
    } catch (err) {
      this.logger.error(
        `[${account}] Fallo al enviar email a ${options.to}: ${(err as Error).message}`,
      )
      return { success: false, error: (err as Error).message }
    }
  }

  /** Verifica que la API Key esté presente y el proveedor listo. */
  testConnection(): {
    success: boolean
    message?: string
    error?: string
  } {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')
    if (apiKey) {
      return {
        success: true,
        message: 'RESEND_API_KEY presente. Proveedor listo.',
      }
    }
    return {
      success: false,
      error: 'RESEND_API_KEY no encontrada en configuración',
    }
  }
}
