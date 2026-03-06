import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SupportService } from './src/support/support.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supportService = app.get(SupportService);
  
  const tickets = await supportService.findAll();
  if (tickets.length > 0) {
    const ticket = tickets[0];
    console.log('Updating ticket:', ticket.id);
    try {
      await supportService.updateTicket(ticket.id, {
        adminResponse: 'Test response ' + Date.now(),
        status: 'in-progress'
      });
      console.log('Update successful');
    } catch (e) {
      console.error('Update failed:', e);
    }
  } else {
    console.log('No tickets found');
  }
  await app.close();
}
bootstrap().catch(console.error);
