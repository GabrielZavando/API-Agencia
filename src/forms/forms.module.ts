import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail/mail.module';
// import { AiModule } from '../ai/ai.module'; // Comentado temporalmente

@Module({
  imports: [FirebaseModule, MailModule], // AiModule comentado temporalmente
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
