import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactDto } from './dto/contact.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { FirebaseService, ProspectRecord } from '../firebase/firebase.service';
import { TemplateService } from '../templates/template.service';
// import { AIService } from '../ai/ai.service'; // Comentado temporalmente
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FormsService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly templateService: TemplateService,
    // private readonly aiService: AIService, // Comentado temporalmente
    private readonly configService: ConfigService,
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
      // Usar archivo JSON
      try {
        const smtpConfig = JSON.parse(fs.readFileSync(smtpConfigPath, 'utf8'));
        this.transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
          },
        });
        console.log(
          `📧 SMTP configurado desde archivo JSON: ${smtpConfig.host}:${smtpConfig.port} (secure: ${smtpConfig.secure})`,
        );
      } catch (error) {
        console.error('Error cargando configuración SMTP desde JSON:', error);
        this.initializeSMTPFromEnv();
      }
    } else {
      // Fallback: usar variables de entorno
      this.initializeSMTPFromEnv();
    }
  }

  private initializeSMTPFromEnv() {
    // Configurar el transportador de email con variables de entorno
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: this.configService.get('SMTP_SECURE') === 'true', // true para puerto 465, false para otros
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    console.log(
      `📧 SMTP configurado desde variables de entorno: ${this.configService.get('SMTP_HOST')}:${this.configService.get('SMTP_PORT')} (secure: ${this.configService.get('SMTP_SECURE')})`,
    );
  }

  // Normaliza strings leídos del .env (quita comillas y espacios)
  private clean(v?: string): string {
    return (v ?? '')
      .toString()
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }

  // Método principal del flujo
  async handleContact(contactDto: ContactDto) {
    try {
      // 1. Recibir formulario (ya validado por el DTO)

      // 2. Buscar prospecto
      const existingProspect = await this.findProspect(contactDto.email);

      // 3. Generar respuesta personalizada con IA
      const responseContent = await this.generateResponse(
        contactDto,
        existingProspect,
      );

      let prospectId: string;
      let conversationId: string;

      if (!existingProspect) {
        // 4a. Crear nuevo prospecto con primera conversación
        prospectId = await this.storeNewProspect(contactDto, responseContent);
        conversationId = 'first_conversation'; // Se genera internamente
      } else {
        // 4b. Agregar nueva conversación a prospecto existente
        prospectId = existingProspect.prospectId;
        conversationId = await this.storeNewConversation(
          prospectId,
          contactDto,
          responseContent,
        );
      }

      // 5. Enviar respuesta por correo
      const emailSent = await this.sendResponseEmail(
        contactDto,
        responseContent,
        !existingProspect,
      );

      // 6. Enviar notificación al administrador
      const adminNotified = await this.sendAdminNotificationEmail(
        contactDto,
        responseContent,
        !existingProspect,
      );

      // 7. Marcar email como enviado en Firebase
      if (emailSent) {
        await this.firebaseService.markEmailAsSent(prospectId, conversationId);
      }

      return {
        success: true,
        message: 'Formulario procesado correctamente',
        prospectId,
        conversationId,
        emailSent,
        adminNotified,
        isNewProspect: !existingProspect,
      };
    } catch (error) {
      console.error('Error procesando formulario:', error);
      return {
        success: false,
        message: 'Error procesando el formulario',
        error: error.message,
      };
    }
  }

  // Método para buscar prospectos
  private async findProspect(email: string): Promise<ProspectRecord | null> {
    return await this.firebaseService.findProspectByEmail(email);
  }

  // Método para almacenar nuevo prospecto
  private async storeNewProspect(
    contactDto: ContactDto,
    responseContent: string,
  ): Promise<string> {
    return await this.firebaseService.createProspectWithConversation(
      contactDto,
      responseContent,
    );
  }

  // Método para guardar nueva conversación
  private async storeNewConversation(
    prospectId: string,
    contactDto: ContactDto,
    responseContent: string,
  ): Promise<string> {
    return await this.firebaseService.addConversationToProspect(
      prospectId,
      contactDto,
      responseContent,
    );
  }

  // Método para generar respuesta personalizada con IA
  private async generateResponse(
    contactDto: ContactDto,
    existingProspect?: ProspectRecord | null,
  ): Promise<string> {
    try {
      // Temporalmente deshabilitado - falta configurar API keys de IA
      /* 
      const aiResponse = await this.aiService.generateProspectResponse(
        contactDto,
        existingProspect || undefined,
      );
      
      console.log(`Respuesta generada por ${aiResponse.provider} en ${aiResponse.processingTime}ms`);
      return aiResponse.content;
      */

      // Fallback a respuesta estática por ahora (alineada con el contenido del email)
      if (existingProspect) {
        return `Hola ${contactDto.name}, he recibido tu nuevo mensaje y te responderé con prioridad en un plazo máximo de 12 horas.`;
      } else {
        return `Hola ${contactDto.name}, he recibido tu mensaje y te responderé en un plazo máximo de 24 horas.`;
      }
    } catch (error) {
      console.error('Error generando respuesta:', error);

      // Fallback a respuesta estática
      if (existingProspect) {
        return `Hola ${contactDto.name}, he recibido tu nuevo mensaje y te responderé con prioridad en un plazo máximo de 12 horas.`;
      } else {
        return `Hola ${contactDto.name}, he recibido tu mensaje y te responderé en un plazo máximo de 24 horas.`;
      }
    }
  }

  // Método para enviar respuesta por correo
  private async sendResponseEmail(
    contactDto: ContactDto,
    responseContent: string,
    isNewProspect: boolean,
  ): Promise<boolean> {
    try {
      const templateName = isNewProspect
        ? 'welcome-prospect'
        : 'returning-prospect';

      const templateVariables = {
        name: contactDto.name,
        message: contactDto.message,
        responseContent,
        companyName:
          this.configService.get('COMPANY_NAME') ||
          'Gabriel Zavando Full Stack Developer',
        logoUrl:
          this.clean(this.configService.get('LOGO_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/logo-medium.png',
        websiteUrl:
          this.configService.get('WEBSITE_URL') || 'https://gabrielzavando.cl',
        servicesUrl:
          this.clean(this.configService.get('SERVICES_URL')) ||
          'https://l1nq.com/vkSUa',
        address: this.configService.get('COMPANY_ADDRESS') || 'Viña del Mar',
        phone: this.configService.get('COMPANY_PHONE') || '+56 9 641 65 631',
        email:
          this.configService.get('COMPANY_EMAIL') ||
          'contacto@gabrielzavando.cl',
        linkedinUrl:
          this.configService.get('LINKEDIN_URL') ||
          'https://linkedin.com/in/gabrielzavando',
        githubUrl:
          this.configService.get('GITHUB_URL') ||
          'https://github.com/gabrielzavando',
        instagramUrl:
          this.configService.get('INSTAGRAM_URL') ||
          'https://instagram.com/gabrielzavando',
        youtubeUrl:
          this.configService.get('YOUTUBE_URL') ||
          'https://www.youtube.com/@gabrielzavando',
        linkedinIconUrl:
          this.clean(this.configService.get('LINKEDIN_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/linkedin_icon.png',
        instagramIconUrl:
          this.clean(this.configService.get('INSTAGRAM_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/instagram_icon.png',
        githubIconUrl:
          this.clean(this.configService.get('GITHUB_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/github_icon.png',
        youtubeIconUrl:
          this.clean(this.configService.get('YOUTUBE_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/youtube_icon.png',
        unsubscribeUrl: `${this.configService.get('WEBSITE_URL') || 'https://gabrielzavando.cl'}/unsubscribe?email=${contactDto.email}`,
      };

      const htmlContent = await this.templateService.getEmailTemplate(
        templateName,
        templateVariables,
      );

      const mailOptions = {
        from: `"${this.configService.get('COMPANY_NAME') || 'Gabriel Zavando Full Stack Developer'}" <${this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER')}>`,
        to: contactDto.email,
        subject: isNewProspect
          ? `Gracias por contactarnos, ${contactDto.name}`
          : `¡Qué gusto verte de nuevo, ${contactDto.name}!`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `Email corporativo enviado a: ${contactDto.email} (${isNewProspect ? 'nuevo' : 'recurrente'})`,
      );
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  // Método para enviar notificación al administrador
  private async sendAdminNotificationEmail(
    contactDto: ContactDto,
    responseContent: string,
    isNewProspect: boolean,
  ): Promise<boolean> {
    try {
      const adminEmail =
        this.configService.get('COMPANY_EMAIL') || 'contacto@gabrielzavando.cl';

      const mailOptions = {
        from: `"${this.configService.get('COMPANY_NAME') || 'Gabriel Zavando Full Stack Developer'}" <${this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER')}>`,
        to: adminEmail,
        subject: `Nuevo mensaje de contacto ${isNewProspect ? '(NUEVO)' : '(RECURRENTE)'} - ${contactDto.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #FF0080; padding-bottom: 10px;">
              📧 Nuevo mensaje de contacto ${isNewProspect ? '<span style="color: #FF0080;">(PRIMER CONTACTO)</span>' : '<span style="color: #A600FF;">(CONTACTO RECURRENTE)</span>'}
            </h2>

            <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">📋 Información del contacto:</h3>
              <p><strong>Nombre:</strong> ${contactDto.name}</p>
              <p><strong>Email:</strong> ${contactDto.email}</p>
              <p><strong>Teléfono:</strong> ${contactDto.phone || 'No proporcionado'}</p>
              <p><strong>Tipo:</strong> ${isNewProspect ? 'Nuevo prospecto' : 'Prospecto recurrente'}</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>

            <div style="background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">💬 Mensaje del usuario:</h3>
              <div style="background: #f8f8f8; padding: 15px; border-left: 4px solid #FF0080; margin: 10px 0;">
                ${contactDto.message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #2E7D32;">🤖 Respuesta automática enviada:</h3>
              <div style="background: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0;">
                ${responseContent.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #856404;">⚡ Acciones recomendadas:</h4>
              <ul style="margin: 10px 0;">
                <li>Revisar el mensaje y responder personalmente si es necesario</li>
                <li>Actualizar el estado del prospecto en Firebase si corresponde</li>
                <li>Agregar notas o etiquetas según el tipo de consulta</li>
              </ul>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; text-align: center;">
              Este es un mensaje automático generado por el sistema de contacto.<br>
              No responder directamente a este email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `📧 Notificación administrativa enviada a: ${adminEmail} (${isNewProspect ? 'nuevo' : 'recurrente'})`,
      );
      return true;
    } catch (error) {
      console.error('Error enviando notificación administrativa:', error);
      return false;
    }
  }

  // Método para enviar notificación de nueva suscripción al administrador
  private async sendAdminSubscriptionNotification(
    subscribeDto: SubscribeDto,
  ): Promise<boolean> {
    try {
      const adminEmail =
        this.configService.get('COMPANY_EMAIL') || 'contacto@gabrielzavando.cl';

      const mailOptions = {
        from: `"${this.configService.get('COMPANY_NAME') || 'Gabriel Zavando Full Stack Developer'}" <${this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER')}>`,
        to: adminEmail,
        subject: `🔔 Nueva suscripción al newsletter`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #A600FF; padding-bottom: 10px;">
              🔔 Nueva suscripción al newsletter
            </h2>

            <div style="background: #f0e6ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #A600FF;">
              <h3 style="margin-top: 0; color: #333;">📧 Información del nuevo suscriptor:</h3>
              <p><strong>Email:</strong> ${subscribeDto.email}</p>
              <p><strong>Fecha de suscripción:</strong> ${new Date().toLocaleString('es-ES')}</p>
              <p><strong>User Agent:</strong> ${subscribeDto.meta.userAgent}</p>
              <p><strong>Página de origen:</strong> ${subscribeDto.meta.page}</p>
              ${subscribeDto.meta.referrer ? `<p><strong>Referrer:</strong> ${subscribeDto.meta.referrer}</p>` : ''}
            </div>

            <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #2E7D32;">✅ Acciones realizadas automáticamente:</h3>
              <ul style="margin: 10px 0;">
                <li>✅ Suscriptor guardado en base de datos</li>
                <li>✅ Email de bienvenida enviado al suscriptor</li>
                <li>✅ Notificación enviada al administrador</li>
              </ul>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h4 style="margin-top: 0; color: #856404;">📈 Estadísticas y seguimiento:</h4>
              <p style="margin: 10px 0;">
                Este suscriptor se agregó a tu lista de newsletter. Puedes gestionar todas las suscripciones desde Firebase.
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px; text-align: center;">
              Este es un mensaje automático generado por el sistema de suscripciones.<br>
              No responder directamente a este email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `📧 Notificación de suscripción enviada al administrador: ${adminEmail}`,
      );
      return true;
    } catch (error) {
      console.error('Error enviando notificación de suscripción:', error);
      return false;
    }
  }

  // Método para enviar email de bienvenida a suscriptores
  private async sendSubscriberWelcomeEmail(email: string): Promise<boolean> {
    try {
      const templateVariables = {
        companyName:
          this.configService.get('COMPANY_NAME') ||
          'Gabriel Zavando Full Stack Developer',
        logoUrl:
          this.clean(this.configService.get('LOGO_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/logo-medium.png',
        websiteUrl:
          this.configService.get('WEBSITE_URL') || 'https://gabrielzavando.cl',
        address: this.configService.get('COMPANY_ADDRESS') || 'Viña del Mar',
        phone: this.configService.get('COMPANY_PHONE') || '+56 9 641 65 631',
        email:
          this.configService.get('COMPANY_EMAIL') ||
          'contacto@gabrielzavando.cl',
        linkedinUrl:
          this.configService.get('LINKEDIN_URL') ||
          'https://linkedin.com/in/gabrielzavando',
        githubUrl:
          this.configService.get('GITHUB_URL') ||
          'https://github.com/gabrielzavando',
        instagramUrl:
          this.configService.get('INSTAGRAM_URL') ||
          'https://instagram.com/gabrielzavando',
        youtubeUrl:
          this.configService.get('YOUTUBE_URL') ||
          'https://www.youtube.com/@gabrielzavando',
        linkedinIconUrl:
          this.clean(this.configService.get('LINKEDIN_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/linkedin_icon.png',
        instagramIconUrl:
          this.clean(this.configService.get('INSTAGRAM_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/instagram_icon.png',
        githubIconUrl:
          this.clean(this.configService.get('GITHUB_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/github_icon.png',
        youtubeIconUrl:
          this.clean(this.configService.get('YOUTUBE_ICON_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/youtube_icon.png',
        unsubscribeUrl: `${this.configService.get('WEBSITE_URL') || 'https://gabrielzavando.cl'}/unsubscribe?email=${email}`,
      };

      const htmlContent = await this.templateService.getEmailTemplate(
        'subscriber-welcome',
        templateVariables,
      );

      const mailOptions = {
        from: `"${this.configService.get('COMPANY_NAME') || 'Gabriel Zavando Full Stack Developer'}" <${this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: '¡Bienvenido/a a mi newsletter! 🎉',
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Newsletter welcome email enviado a: ${email}`);
      return true;
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return false;
    }
  }

  // Manejo de desuscripción: elimina email de la colección 'subscribers'
  async handleUnsubscribe(email: string) {
    try {
      // Verificar si existe el suscriptor
      const existing = await this.firebaseService.findSubscriberByEmail(email);
      if (!existing) {
        return {
          success: true,
          message: 'El email no estaba suscrito o ya fue eliminado',
          wasSubscribed: false,
        };
      }

      const removed = await this.firebaseService.removeSubscriber(email);

      // Enviar email de confirmación de desuscripción
      const emailSent = await this.sendUnsubscribeConfirmationEmail(email);

      return {
        success: true,
        message: 'Te has desuscrito correctamente de nuestro newsletter',
        wasSubscribed: true,
        removed,
        emailSent,
      };
    } catch (error) {
      console.error('Error procesando desuscripción:', error);
      return {
        success: false,
        message: 'Error procesando la desuscripción',
        error: error.message,
      };
    }
  }

  // Método para enviar email de confirmación de desuscripción
  private async sendUnsubscribeConfirmationEmail(
    email: string,
  ): Promise<boolean> {
    try {
      const templateVariables = {
        companyName:
          this.configService.get('COMPANY_NAME') ||
          'Gabriel Zavando Full Stack Developer',
        logoUrl:
          this.clean(this.configService.get('LOGO_URL')) ||
          'https://raw.githubusercontent.com/GabrielZavando/WebAgenciaAstro/main/logo-medium.png',
        address: this.configService.get('COMPANY_ADDRESS') || 'Viña del Mar',
        phone: this.configService.get('COMPANY_PHONE') || '+56 9 641 65 631',
        email:
          this.configService.get('COMPANY_EMAIL') ||
          'contacto@gabrielzavando.cl',
      };

      const htmlContent = await this.templateService.getEmailTemplate(
        'unsubscribe-confirmation',
        templateVariables,
      );

      const mailOptions = {
        from: `"${this.configService.get('COMPANY_NAME') || 'Gabriel Zavando Full Stack Developer'}" <${this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER')}>`,
        to: email,
        subject: 'Confirmación de desuscripción - Newsletter',
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `Newsletter unsubscribe confirmation email enviado a: ${email}`,
      );
      return true;
    } catch (error) {
      console.error(
        'Error enviando email de confirmación de desuscripción:',
        error,
      );
      return false;
    }
  }

  // Método para probar la conexión a Firebase
  async testFirebaseConnection() {
    return await this.firebaseService.testConnection();
  }

  // Método para probar la configuración SMTP
  async testSMTPConnection() {
    try {
      console.log('🔄 Probando conexión SMTP...');

      // Verificar la conexión
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');

      // Enviar email de prueba
      const testEmail = {
        from: `"${this.configService.get('COMPANY_NAME')}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
        to: this.configService.get('SMTP_USER'), // Enviar a la misma dirección para prueba
        subject: 'Prueba de configuración SMTP - API',
        html: `
          <h2>🎉 ¡Configuración SMTP exitosa!</h2>
          <p>Este es un email de prueba para verificar que la configuración SMTP está funcionando correctamente.</p>
          <hr>
          <p><strong>Configuración:</strong></p>
          <ul>
            <li><strong>Servidor:</strong> ${this.configService.get('SMTP_HOST')}</li>
            <li><strong>Puerto:</strong> ${this.configService.get('SMTP_PORT')}</li>
            <li><strong>Seguro:</strong> ${this.configService.get('SMTP_SECURE')}</li>
            <li><strong>Usuario:</strong> ${this.configService.get('SMTP_USER')}</li>
          </ul>
          <p><em>Enviado desde: ${this.configService.get('COMPANY_NAME')}</em></p>
        `,
      };

      const result = await this.transporter.sendMail(testEmail);
      console.log('✅ Email de prueba enviado exitosamente');

      return {
        success: true,
        message: 'Configuración SMTP exitosa',
        messageId: result.messageId,
        from: testEmail.from,
        to: testEmail.to,
        config: {
          host: this.configService.get('SMTP_HOST'),
          port: this.configService.get('SMTP_PORT'),
          secure: this.configService.get('SMTP_SECURE'),
          user: this.configService.get('SMTP_USER'),
        },
      };
    } catch (error) {
      console.error('❌ Error en configuración SMTP:', error);
      return {
        success: false,
        message: 'Error en configuración SMTP',
        error: error.message,
        config: {
          host: this.configService.get('SMTP_HOST'),
          port: this.configService.get('SMTP_PORT'),
          secure: this.configService.get('SMTP_SECURE'),
          user: this.configService.get('SMTP_USER'),
        },
      };
    }
  }

  // Manejo de suscripciones: guarda email + meta en colección 'subscribers'
  async handleSubscribe(subscribeDto: SubscribeDto) {
    try {
      // Verificar si ya existe
      const existing = await this.firebaseService.findSubscriberByEmail(
        subscribeDto.email,
      );
      if (existing) {
        return {
          success: true,
          alreadySubscribed: true,
          message: 'El correo ya está suscrito',
          subscriberId: existing.subscriberId,
        };
      }

      const id = await this.firebaseService.saveSubscriber(subscribeDto);

      // Enviar notificación al administrador
      const adminNotified =
        await this.sendAdminSubscriptionNotification(subscribeDto);

      // Enviar email de bienvenida al nuevo suscriptor
      const emailSent = await this.sendSubscriberWelcomeEmail(
        subscribeDto.email,
      );

      return {
        success: true,
        alreadySubscribed: false,
        message: 'Suscriptor añadido correctamente',
        subscriberId: id,
        adminNotified,
        emailSent,
      };
    } catch (error) {
      console.error('Error registrando suscripción:', error);
      return {
        success: false,
        message: 'Error registrando la suscripción',
        error: error.message,
      };
    }
  }
}
