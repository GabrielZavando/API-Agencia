import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar CORS
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    'https://gabrielzavando.cl,http://localhost:4321,http://127.0.0.1:4321,http://localhost:3000'
  ).split(',');

  // Agregar origenes locales para desarrollo si no están (por si ALLOWED_ORIGINS está definido sin ellos)
  if (!allowedOrigins.includes('http://localhost:4321')) {
    allowedOrigins.push('http://localhost:4321', 'http://127.0.0.1:4321');
  }

  // Si la app se ejecuta detrás de un proxy (Cloud Run), confiar en él para X-Forwarded-*
  app.set('trust proxy', true);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe());

  // Cloud Run espera que la aplicación escuche el puerto indicado en PORT (usualmente 8080)
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap().catch((err: unknown) => {
  console.error('Error during bootstrap', err);
});
