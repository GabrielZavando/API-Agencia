import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('clients')
@UseGuards(FirebaseAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles('admin')
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}
