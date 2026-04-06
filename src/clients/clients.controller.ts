import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ClientsService } from './clients.service'
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { ClientResponseDto } from './dto/client-response.dto'

@Controller('clients')
@UseGuards(FirebaseAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles('admin')
  findAll(): Promise<ClientResponseDto[]> {
    return this.clientsService.findAll()
  }

  @Get('assignable')
  @Roles('admin')
  findAssignable(): Promise<ClientResponseDto[]> {
    return this.clientsService.findAssignable()
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string): Promise<ClientResponseDto | null> {
    return this.clientsService.findOne(id)
  }
}
