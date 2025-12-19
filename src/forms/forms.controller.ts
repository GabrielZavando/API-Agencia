
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ContactDto } from './dto/contact.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { FormsService } from './forms.service';


@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) { }

  @Post('contact')
  handleContact(@Body() contactDto: ContactDto) {
    return this.formsService.handleContact(contactDto);
  }

  @Post('subscribe')
  handleSubscribe(@Body() subscribeDto: SubscribeDto) {
    return this.formsService.handleSubscribe(subscribeDto);
  }

  @Post('unsubscribe')
  handleUnsubscribe(@Query('email') email: string) {
    return this.formsService.handleUnsubscribe(email);
  }

  @Get('test-firebase')
  async testFirebase() {
    try {
      const testResult = await this.formsService.testFirebaseConnection();
      return {
        success: true,
        message: 'Conexión a Firebase exitosa',
        details: testResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error conectando a Firebase',
        error: error.message
      };
    }
  }

  @Get('test-smtp')
  async testSMTP() {
    const testResult = await this.formsService.testSMTPConnection();
    return testResult;
  }

  @Get('status')
  async getStatus() {
    return {
      success: true,
      message: 'API funcionando correctamente',
      features: {
        firebase: '✅ Configurado',
        smtp: '✅ Configurado (Hostinger)',
        ai: '⚠️ Deshabilitado (faltan API keys)',
        templates: '✅ Configurado',
      },
      endpoints: {
        contact: 'POST /forms/contact',
        subscribe: 'POST /forms/subscribe',
        unsubscribe: 'POST /forms/unsubscribe?email=example@email.com',
        testFirebase: 'GET /forms/test-firebase',
        testSMTP: 'GET /forms/test-smtp',
        status: 'GET /forms/status',
      }
    };
  }
}
