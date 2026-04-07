import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TemplateService } from '../templates/template.service'
import * as nodemailer from 'nodemailer'
import { companyConfig } from '../config/company.config'
import { SystemConfigService } from '../system-config/system-config.service'

import { MailAccount, MailOptions } from './interfaces/mail.interface'

@Injectable()
export class MailService {
  private transporters: Map<MailAccount, nodemailer.Transporter> = new Map()
  private fromAddresses: Map<MailAccount, string> = new Map()
  private readonly logger = new Logger(MailService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
    private readonly systemConfigService: SystemConfigService,
  ) {
    this.initializeTransporters()
  }

  private initializeTransporters() {
    // 1. Inicializar cuenta de CONTACTO (Principal)
    const contactUser = this.clean(this.configService.get<string>('SMTP_USER'))
    const contactPass = this.clean(this.configService.get<string>('SMTP_PASS'))

    this.transporters.set(
      'CONTACT',
      nodemailer.createTransport({
        host: this.clean(
          this.configService.get<string>('SMTP_HOST') || 'smtp.hostinger.com',
        ),
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
      this.clean(
        this.configService.get<string>('SMTP_FROM_EMAIL') || contactUser,
      ),
    )

    // 2. Inicializar cuenta de SOPORTE
    const supportUser = this.clean(
      this.configService.get<string>('SMTP_SUPPORT_USER'),
    )
    const supportPass = this.clean(
      this.configService.get<string>('SMTP_SUPPORT_PASS'),
    )

    if (supportUser && supportPass) {
      this.transporters.set(
        'SUPPORT',
        nodemailer.createTransport({
          host: this.clean(
            this.configService.get<string>('SMTP_HOST') || 'smtp.hostinger.com',
          ),
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
        this.clean(
          this.configService.get<string>('SMTP_SUPPORT_FROM_EMAIL') ||
            supportUser,
        ),
      )
      this.logger.log('Transporter de SOPORTE configurado correctamente.')
    } else {
      this.logger.warn(
        'Configuración de SOPORTE incompleta. Se usará CONTACTO como fallback.',
      )
    }
  }

  async getBaseVariables(email: string) {
    const websiteUrl = companyConfig.websiteUrl
    await Promise.resolve()
    return {
      siteName: companyConfig.name,
      name: companyConfig.name,
      companyName: companyConfig.name,
      websiteUrl: websiteUrl,
      logoUrl: companyConfig.logoUrl,
      address: companyConfig.address,
      phone: companyConfig.phone,
      email: companyConfig.email,
      servicesUrl: companyConfig.servicesUrl,
      calendlyUrl: companyConfig.calendlyUrl,
      blogUrl: companyConfig.blogUrl,

      // Aplanadas para las plantillas que usan {{linkedinUrl}} directamente

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
        youtubeIconUrl: companyConfig.social.youtubeIconUrl,
      },
      unsubscribeUrl: `${websiteUrl}/unsubscribe?email=${email}`,
      currentYear: new Date().getFullYear().toString(),
    } as Record<string, unknown>
  }

  private clean(v?: string): string {
    if (!v) return ''
    return v
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
        const baseVariables = await this.getBaseVariables(options.to)
        const mergedVariables = { ...baseVariables, ...variables }

        finalHtml = await this.templateService.getEmailTemplate(
          options.templateName,
          mergedVariables,
        )
      }

      const config = await this.systemConfigService.getConfig()
      const companyName = config?.name || companyConfig.name
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

  async sendMailDetailed(
    options: MailOptions,
  ): Promise<{ success: boolean; error?: string }> {
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
        const baseVariables = await this.getBaseVariables(options.to)
        const mergedVariables = { ...baseVariables, ...variables }

        finalHtml = await this.templateService.getEmailTemplate(
          options.templateName,
          mergedVariables,
        )
      }

      const config = await this.systemConfigService.getConfig()
      const companyName = config?.name || companyConfig.name
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
      return { success: true }
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}:`, error)
      return { success: false, error: (error as Error).message }
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
