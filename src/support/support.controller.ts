import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('attachment'))
  createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTicketDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.supportService.createTicket(
      req.user!.uid,
      req.user!.email || '',
      dto,
      file,
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

  /** Obtener un ticket por ID (Cliente o Admin) */
  @Get('tickets/:id')
  getTicketById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    // Firebase auth claims define the role.
    const user = req.user as { uid: string; role?: string };
    const role = user.role || 'client';
    return this.supportService.findById(id, user.uid, role);
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
