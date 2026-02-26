import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  FirebaseAuthGuard,
  AuthenticatedRequest,
} from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('support')
@UseGuards(FirebaseAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /** Cliente: crear nuevo ticket */
  @Post('tickets')
  @Roles('client')
  createTicket(@Req() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(
      req.user!.uid,
      req.user!.email || '',
      dto,
    );
  }

  /** Cliente: obtener su cuota de tickets */
  @Get('tickets/quota')
  @Roles('client')
  getQuota(@Req() req: AuthenticatedRequest) {
    return this.supportService.getTicketQuota(req.user!.uid);
  }

  /** Cliente: obtener sus tickets */
  @Get('tickets/my')
  @Roles('client')
  getMyTickets(@Req() req: AuthenticatedRequest) {
    return this.supportService.findByClient(req.user!.uid);
  }

  /** Admin: listar todos los tickets */
  @Get('tickets')
  @Roles('admin')
  findAll() {
    return this.supportService.findAll();
  }

  /** Admin: actualizar ticket */
  @Patch('tickets/:id')
  @Roles('admin')
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(id, dto);
  }
}
