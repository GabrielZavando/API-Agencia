
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar CORS para desarrollo
  app.enableCors({
    origin: ['http://localhost:4321', 'http://127.0.0.1:4321'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe());

  // Servir archivos estáticos desde la carpeta 'public'
  // Accesibles en runtime en: http://<host>:<port>/public/<ruta>
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });

  console.log('Static assets served from:', join(__dirname, '..', 'public'));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
