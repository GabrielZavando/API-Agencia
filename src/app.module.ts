import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { FormsModule } from './forms/forms.module';
import { TemplatesModule } from './templates/templates.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { BlogModule } from './blog/blog.module';
import { ClientsModule } from './clients/clients.module';
import { ReportsModule } from './reports/reports.module';
import { SupportModule } from './support/support.module';
import { FilesModule } from './files/files.module';
import { ProjectsModule } from './projects/projects.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    FormsModule,
    TemplatesModule,
    AiModule,
    UsersModule,
    BlogModule,
    ClientsModule,
    ReportsModule,
    SupportModule,
    FilesModule,
    ProjectsModule,
    MailModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
