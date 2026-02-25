import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, FirebaseAuthGuard],
})
export class ClientsModule {}
