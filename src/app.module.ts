import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { BlogCategoriesModule } from './blog-categories/blog-categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60_000, limit: 10 }, // 10 req / min (general)
    ]),
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
    BlogCategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
