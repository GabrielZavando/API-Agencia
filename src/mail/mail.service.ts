import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from '../templates/template.service';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

export interface MailOptions {
  to: string;
  subject: string;
  templateName?: string;
  templateVariables?: Record<string, any>;
  html?: string;
  isNewProspect?: boolean;
  from?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly templateService: TemplateService,
  ) {
    this.initializeSMTP();
  }

  private initializeSMTP() {
    // Intentar cargar configuración SMTP desde archivo JSON primero
    const smtpConfigPath = path.join(
      process.cwd(),
      'config',
      'smtp-config.json',
    );

    if (fs.existsSync(smtpConfigPath)) {
      try {
        const fileContent = fs.readFileSync(smtpConfigPath, 'utf8');
        const smtpConfig = JSON.parse(fileContent) as Record<
          string,
          string | number | boolean
        >;
        this.transporter = nodemailer.createTransport({
          host: smtpConfig.host as string,
          port: Number(smtpConfig.port),
          secure: Boolean(smtpConfig.secure),
          auth: {
            user: smtpConfig.user as string,
            pass: smtpConfig.pass as string,
          },
        });
        this.logger.log(
          `SMTP configurado desde archivo JSON: ${smtpConfig.host}:${smtpConfig.port} (secure: ${smtpConfig.secure})`,
        );
      } catch (error) {
        this.logger.error(
          'Error cargando configuración SMTP desde JSON:',
          error,
        );
        this.initializeSMTPFromEnv();
      }
    } else {
      this.initializeSMTPFromEnv();
    }
  }

  private initializeSMTPFromEnv() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    this.logger.log(
      `SMTP configurado desde variables de entorno: ${this.configService.get<string>('SMTP_HOST')}:${this.configService.get<string>('SMTP_PORT')} (secure: ${this.configService.get<string>('SMTP_SECURE')})`,
    );
  }

  // Helper para variables compartidas en todas las plantillas
  public getBaseVariables(email: string) {
    return {
      companyName:
        this.configService.get<string>('COMPANY_NAME') ||
        'Gabriel Zavando Full Stack Developer',
      logoUrl:
        this.clean(this.configService.get<string>('LOGO_URL')) ||
        'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/logo-medium.png',
      websiteUrl:
        this.configService.get<string>('WEBSITE_URL') ||
        'https://gabrielzavando.cl',
      address:
        this.configService.get<string>('COMPANY_ADDRESS') || 'Viña del Mar',
      phone:
        this.configService.get<string>('COMPANY_PHONE') || '+56 9 641 65 631',
      email:
        this.configService.get<string>('COMPANY_EMAIL') ||
        'contacto@gabrielzavando.cl',
      linkedinUrl:
        this.configService.get<string>('LINKEDIN_URL') ||
        'https://linkedin.com/in/gabrielzavando',
      githubUrl:
        this.configService.get<string>('GITHUB_URL') ||
        'https://github.com/gabrielzavando',
      instagramUrl:
        this.configService.get<string>('INSTAGRAM_URL') ||
        'https://instagram.com/gabrielzavando',
      youtubeUrl:
        this.configService.get<string>('YOUTUBE_URL') ||
        'https://www.youtube.com/@gabrielzavando',
      linkedinIconUrl:
        this.clean(this.configService.get<string>('LINKEDIN_ICON_URL')) ||
        'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/linkedin_icon.png',
      instagramIconUrl:
        this.clean(this.configService.get<string>('INSTAGRAM_ICON_URL')) ||
        'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/instagram_icon.png',
      githubIconUrl:
        this.clean(this.configService.get<string>('GITHUB_ICON_URL')) ||
        'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/github_icon.png',
      youtubeIconUrl:
        this.clean(this.configService.get<string>('YOUTUBE_ICON_URL')) ||
        'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/youtube_icon.png',
      unsubscribeUrl: `${this.configService.get<string>('WEBSITE_URL') || 'https://gabrielzavando.cl'}/unsubscribe?email=${email}`,
    };
  }

  private clean(v?: string): string {
    return (v ?? '')
      .toString()
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }

  async sendMail(options: MailOptions): Promise<boolean> {
    try {
      let finalHtml = options.html || '';

      if (options.templateName) {
        const variables = options.templateVariables || {};
        const baseVariables = this.getBaseVariables(options.to);
        const mergedVariables = { ...baseVariables, ...variables };

        finalHtml = await this.templateService.getEmailTemplate(
          options.templateName,
          mergedVariables,
        );
      }

      const mailOptions = {
        from:
          options.from ||
          `"${this.configService.get<string>('COMPANY_NAME') || 'Gabriel Zavando Full Stack Developer'}" <${this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER')}>`,
        to: options.to,
        subject: options.subject,
        html: finalHtml,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email enviado con éxito a: ${options.to} con asunto: ${options.subject}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email a ${options.to}:`, error);
      return false;
    }
  }

  async testConnection() {
    try {
      this.logger.log('Probando conexión SMTP...');
      await this.transporter.verify();
      this.logger.log('Conexión SMTP verificada correctamente');

      const adminEmail =
        this.configService.get<string>('SMTP_USER') ||
        'contacto@gabrielzavando.cl';
      const result = await this.sendMail({
        to: adminEmail,
        subject: 'Prueba de configuración SMTP - API',
        html: `
          <h2>🎉 ¡Configuración SMTP exitosa!</h2>
           <p>Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
           <hr>
           <p><strong>Configuración:</strong></p>
           <ul>
             <li><strong>Servidor:</strong> ${this.configService.get<string>('SMTP_HOST')}</li>
             <li><strong>Puerto:</strong> ${this.configService.get<string>('SMTP_PORT')}</li>
             <li><strong>Seguro:</strong> ${this.configService.get<string>('SMTP_SECURE')}</li>
             <li><strong>Usuario:</strong> ${this.configService.get<string>('SMTP_USER')}</li>
           </ul>
           <p><em>Enviado desde: ${this.configService.get<string>('COMPANY_NAME')}</em></p>
          `,
      });

      return {
        success: result,
        message: result
          ? 'Configuración SMTP exitosa'
          : 'Error enviando email de prueba',
      };
    } catch (error) {
      this.logger.error('Error en configuración SMTP:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}
