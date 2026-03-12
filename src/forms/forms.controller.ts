import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Redirect,
} from '@nestjs/common'
import { ContactDto } from './dto/contact.dto'
import { SubscribeDto } from './dto/subscribe.dto'
import { FormsService } from './forms.service'
import { Throttle, SkipThrottle } from '@nestjs/throttler'

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Throttle({ short: { ttl: 900_000, limit: 5 } }) // 5 req / 15 min por IP
  @Post('contact')
  handleContact(@Body() contactDto: ContactDto) {
    return this.formsService.handleContact(contactDto)
  }

  @Throttle({ short: { ttl: 600_000, limit: 3 } }) // 3 req / 10 min por IP
  @Post('subscribe')
  handleSubscribe(@Body() subscribeDto: SubscribeDto) {
    return this.formsService.handleSubscribe(subscribeDto)
  }

  @Post('unsubscribe')
  handleUnsubscribe(@Query('email') email: string) {
    return this.formsService.handleUnsubscribe(email)
  }

  // --- Endpoints de Administración ---

  @SkipThrottle()
  @Get('admin/subscribers')
  getSubscribers() {
    return this.formsService.getAllSubscribers()
  }

  @SkipThrottle()
  @Get('admin/prospects')
  getProspects() {
    return this.formsService.getAllProspects()
  }

  @SkipThrottle()
  @Get('admin/prospects/:id')
  getProspectById(@Param('id') id: string) {
    return this.formsService.getProspectById(id)
  }

  // Double Opt-In: confirmación de suscripción por token
  @SkipThrottle()
  @Get('verify-subscription/:token')
  @Redirect()
  async verifySubscription(@Param('token') token: string) {
    const result = await this.formsService.verifySubscription(token)
    if (result.success) {
      return { url: '/suscripcion-confirmada?status=ok' }
    }
    return { url: '/suscripcion-confirmada?status=error' }
  }

  @Post('admin/prospects/:id/reply')
  adminReplyToProspect(
    @Param('id') id: string,
    @Body('replyContent') replyContent: string,
  ) {
    return this.formsService.adminReplyToProspect(id, replyContent)
  }

  // --- Campaña de Re-confirmación y Limpieza ---

  @SkipThrottle()
  @Post('admin/subscribers/reconfirmation-campaign')
  runReconfirmationCampaign() {
    return this.formsService.runReconfirmationCampaign()
  }

  @SkipThrottle()
  @Post('admin/subscribers/cleanup-inactive')
  cleanupInactiveSubscribers(@Body('daysThreshold') daysThreshold: number) {
    return this.formsService.cleanupInactiveSubscribers(daysThreshold ?? 7)
  }

  @SkipThrottle()
  @Get('admin/subscribers/export')
  exportSubscribers() {
    return this.formsService.exportSubscribers()
  }

  // --- Endpoints de Diagnóstico ---

  @Get('test-firebase')
  async testFirebase() {
    try {
      const testResult = await this.formsService.testFirebaseConnection()
      return {
        success: true,
        message: 'Conexión a Firebase exitosa',
        details: testResult,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error conectando a Firebase',
        error: (error as Error).message,
      }
    }
  }

  @Get('test-smtp')
  async testSMTP() {
    const testResult = await this.formsService.testSMTPConnection()
    return testResult
  }

  @Get('status')
  getStatus() {
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
      },
    }
  }
}
