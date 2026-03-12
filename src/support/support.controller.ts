import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { SupportService } from './support.service'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'
import { AddMessageDto } from './dto/add-message.dto'
import {
  FirebaseAuthGuard,
  AuthenticatedRequest,
} from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'

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
    )
  }

  /** Cliente: obtener su cuota de tickets */
  @Get('tickets/quota')
  @Roles('client')
  getQuota(@Req() req: AuthenticatedRequest) {
    return this.supportService.getTicketQuota(req.user!.uid)
  }

  /** Cliente: obtener sus tickets */
  @Get('tickets/my')
  @Roles('client')
  getMyTickets(@Req() req: AuthenticatedRequest) {
    return this.supportService.findByClient(req.user!.uid)
  }

  /** Admin: obtener tickets de un cliente específico */
  @Get('tickets/client/:clientId')
  @Roles('admin')
  getClientTickets(@Param('clientId') clientId: string) {
    return this.supportService.findByClient(clientId)
  }

  /** Obtener un ticket por ID (Cliente o Admin) */
  @Get('tickets/:id')
  getTicketById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = req.user as { uid: string; role?: string }
    const role = user.role || 'client'
    return this.supportService.findById(id, user.uid, role)
  }

  /** Admin: listar todos los tickets */
  @Get('tickets')
  @Roles('admin')
  findAll() {
    return this.supportService.findAll()
  }

  /** Admin: actualizar ticket (estado, adminResponse) */
  @Patch('tickets/:id')
  @Roles('admin')
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(id, dto)
  }

  /** Admin y Cliente: obtener mensajes de un ticket */
  @Get('tickets/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.supportService.getMessages(id)
  }

  /** Admin y Cliente: enviar un mensaje en un ticket */
  @Post('tickets/:id/messages')
  @UseInterceptors(FileInterceptor('attachment'))
  addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const email = req.user!.email || 'desconocido'
    return this.supportService.addMessage(id, dto, email, file)
  }

  /** Admin: eliminar ticket */
  @Delete('tickets/:id')
  @Roles('admin')
  deleteTicket(@Param('id') id: string) {
    return this.supportService.deleteTicket(id)
  }
}
