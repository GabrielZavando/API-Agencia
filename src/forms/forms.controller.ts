import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ContactDto } from './dto/contact.dto'
import { SubscribeDto } from './dto/subscribe.dto'
import { FormsService } from './forms.service'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { SubscriberResponseDto } from './dto/form-response.dto'

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Throttle({ short: { ttl: 900_000, limit: 5 } }) // 5 req / 15 min por IP
  @Post('contact')
  async handleContact(@Body() contactDto: ContactDto): Promise<any> {
    return this.formsService.handleContact(contactDto)
  }

  @Throttle({ short: { ttl: 600_000, limit: 3 } }) // 3 req / 10 min por IP
  @Post('subscribe')
  async handleSubscribe(@Body() subscribeDto: SubscribeDto): Promise<any> {
    return this.formsService.handleSubscribe(subscribeDto)
  }

  @Post('unsubscribe')
  async handleUnsubscribe(@Query('email') email: string): Promise<any> {
    return this.formsService.handleUnsubscribe(email)
  }

  // --- Endpoints de Administración de Contactos ---

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Get('admin/contactos')
  async getAllContactos(): Promise<any[]> {
    return this.formsService.getAllContactos()
  }

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Get('admin/contactos/:id')
  async getContactoDetail(@Param('id') id: string): Promise<any> {
    return this.formsService.getContactoFullDetail(id)
  }

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Post('admin/contactos/:id/consultas/:consultaId/reply')
  async replyToConsulta(
    @Param('id') id: string,
    @Param('consultaId') consultaId: string,
    @Body('message') message: string,
  ): Promise<any> {
    return this.formsService.addAdminReplyToConsulta(id, consultaId, message)
  }

  // --- Endpoints de Administración de Suscriptores ---

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Get('admin/subscribers')
  async getAllSubscribers(): Promise<SubscriberResponseDto[]> {
    return this.formsService.getAllSubscribers()
  }

  // --- Campaña de Re-confirmación y Limpieza ---

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Post('admin/subscribers/bulk-delete')
  async bulkDeleteSubscribers(@Body('ids') ids: string[]): Promise<any> {
    return this.formsService.bulkDeleteSubscribers(ids)
  }

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Post('admin/subscribers/bulk-confirm')
  async bulkConfirmSubscribers(@Body('ids') ids: string[]): Promise<any> {
    return this.formsService.bulkConfirmSubscribers(ids)
  }

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Post('admin/subscribers/reconfirmation-campaign')
  async runReconfirmationCampaign(): Promise<any> {
    return this.formsService.runReconfirmationCampaign()
  }

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Post('admin/subscribers/cleanup-inactive')
  async cleanupInactiveSubscribers(
    @Body('daysThreshold') daysThreshold: number,
  ): Promise<any> {
    return this.formsService.cleanupInactiveSubscribers(daysThreshold ?? 7)
  }

  @SkipThrottle()
  @UseGuards(FirebaseAuthGuard)
  @Roles('admin')
  @Get('admin/subscribers/export')
  async exportSubscribers(): Promise<any> {
    return await this.formsService.exportSubscribers()
  }

  // --- Endpoints de Diagnóstico ---

  @Get('test-firebase')
  async testFirebase(): Promise<any> {
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
  async testSMTP(): Promise<any> {
    return this.formsService.testSMTPConnection()
  }

  @Get('status')
  async getStatus(): Promise<any> {
    return Promise.resolve({
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
      },
    })
  }
}
