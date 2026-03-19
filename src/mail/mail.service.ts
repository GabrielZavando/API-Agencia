import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../templates/template.service'
import * as nodemailer from 'nodemailer'
import { companyConfig } from '../config/company.config'

export type MailAccount = 'CONTACT' | 'SUPPORT'

export interface MailOptions {
  to: string
  subject: string
  templateName?: string
  templateVariables?: Record<string, any>
  html?: string
  isNewProspect?: boolean
  from?: string
  account?: MailAccount // Nueva opción para elegir cuenta
  attachments?: any[]
}

@Injectable()
export class MailService {
  private transporters: Map<MailAccount, nodemailer.Transporter> = new Map()
  private fromAddresses: Map<MailAccount, string> = new Map()
  private readonly logger = new Logger(MailService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.initializeTransporters()
  }

  private initializeTransporters() {
    // 1. Inicializar cuenta de CONTACTO (Principal)
    const contactUser = this.configService.get<string>('SMTP_USER') || ''
    const contactPass = this.configService.get<string>('SMTP_PASS') || ''

    this.transporters.set(
      'CONTACT',
      nodemailer.createTransport({
        host:
          this.configService.get<string>('SMTP_HOST') || 'smtp.hostinger.com',
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '465'),
        secure: this.configService.get<string>('SMTP_SECURE') !== 'false',
        auth: {
          user: contactUser,
          pass: contactPass,
        },
      }),
    )
    this.fromAddresses.set(
      'CONTACT',
      this.configService.get<string>('SMTP_FROM_EMAIL') || contactUser,
    )

    // 2. Inicializar cuenta de SOPORTE
    const supportUser = this.configService.get<string>('SMTP_SUPPORT_USER')
    const supportPass = this.configService.get<string>('SMTP_SUPPORT_PASS')

    if (supportUser && supportPass) {
      this.transporters.set(
        'SUPPORT',
        nodemailer.createTransport({
          host:
            this.configService.get<string>('SMTP_HOST') || 'smtp.hostinger.com',
          port: parseInt(this.configService.get<string>('SMTP_PORT') || '465'),
          secure: this.configService.get<string>('SMTP_SECURE') !== 'false',
          auth: {
            user: supportUser,
            pass: supportPass,
          },
        }),
      )
      this.fromAddresses.set(
        'SUPPORT',
        this.configService.get<string>('SMTP_SUPPORT_FROM_EMAIL') ||
          supportUser,
      )
      this.logger.log('Transporter de SOPORTE configurado correctamente.')
    } else {
      this.logger.warn(
        'Configuración de SOPORTE incompleta. Se usará CONTACTO como fallback.',
      )
    }
  }

  // Helper para variables compartidas en todas las plantillas
  public getBaseVariables(email: string) {
    return {
      companyName: companyConfig.name,
      logoUrl: companyConfig.logoUrl,
      websiteUrl: companyConfig.websiteUrl,
      address: companyConfig.address,
      phone: companyConfig.phone,
      email: companyConfig.email,
      linkedinUrl: companyConfig.social.linkedinUrl,
      githubUrl: companyConfig.social.githubUrl,
      instagramUrl: companyConfig.social.instagramUrl,
      youtubeUrl: companyConfig.social.youtubeUrl,
      linkedinIconUrl: companyConfig.social.linkedinIconUrl,
      instagramIconUrl: companyConfig.social.instagramIconUrl,
      githubIconUrl: companyConfig.social.githubIconUrl,
      youtubeIconUrl: companyConfig.social.youtubeIconUrl,
      unsubscribeUrl: `${companyConfig.websiteUrl}/unsubscribe?email=${email}`,
    }
  }

  private clean(v?: string): string {
    return (v ?? '')
      .toString()
      .trim()
      .replace(/^['"]|['"]$/g, '')
  }

  async sendMail(options: MailOptions): Promise<boolean> {
    try {
      const account = options.account || 'CONTACT'
      const transporter =
        this.transporters.get(account) || this.transporters.get('CONTACT')
      const fromAddress =
        this.fromAddresses.get(account) || this.fromAddresses.get('CONTACT')

      if (!transporter) {
        throw new Error(`Transporter no disponible para la cuenta: ${account}`)
      }

      let finalHtml = options.html || ''

      if (options.templateName) {
        const variables = options.templateVariables || {}
        const baseVariables = this.getBaseVariables(options.to)
        const mergedVariables = { ...baseVariables, ...variables }

        finalHtml = await this.templateService.getEmailTemplate(
          options.templateName,
          mergedVariables,
        )
      }

      const companyName = companyConfig.name
      const displayName =
        account === 'SUPPORT' ? `Soporte ${companyName}` : companyName

      const mailOptions = {
        from: options.from || `"${displayName}" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: finalHtml,
        attachments: options.attachments,
      }

      await transporter.sendMail(mailOptions)
      this.logger.log(
        `Email [${account}] enviado con éxito a: ${options.to} con asunto: ${options.subject}`,
      )
      return true
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}:`, error)
      return false
    }
  }

  async testConnection() {
    try {
      this.logger.log('Probando conexiones SMTP...')
      for (const [name, transporter] of this.transporters.entries()) {
        await transporter.verify()
        this.logger.log(`Conexión SMTP [${name}] verificada correctamente`)
      }

      return {
        success: true,
        message: 'Todas las conexiones SMTP verificadas',
      }
    } catch (error) {
      this.logger.error('Error en configuración SMTP:', error)
      return { success: false, error: (error as Error).message }
    }
  }
}
