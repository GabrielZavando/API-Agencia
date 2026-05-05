import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as fs from 'fs'
import * as path from 'path'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Configurar CORS
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    'https://gabrielzavando.cl,http://localhost:4321,http://127.0.0.1:4321,http://localhost:3000'
  ).split(',')

  // Agregar origenes locales para desarrollo si no están (por si ALLOWED_ORIGINS está definido sin ellos)
  if (!allowedOrigins.includes('http://localhost:4321')) {
    allowedOrigins.push('http://localhost:4321', 'http://127.0.0.1:4321')
  }

  // Si la app se ejecuta detrás de un proxy (Cloud Run), confiar en él para X-Forwarded-*
  app.set('trust proxy', true)

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  })

  // Validación global
  app.useGlobalPipes(new ValidationPipe())
  
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('WebAstro API')
    .setDescription('API para la Agencia Digital WebAstro')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  // Exportar swagger.json para Contract Testing si no estamos en producción
  if (process.env.NODE_ENV !== 'production') {
    const outputPath = path.resolve(process.cwd(), 'swagger.json')
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2))
    console.log(`OpenAPI schema saved to ${outputPath}`)
  }

  // Cloud Run espera que la aplicación escuche el puerto indicado en PORT (usualmente 8080)
  // Es vital escuchar en '0.0.0.0' para ser accesible desde fuera del contenedor
  await app.listen(process.env.PORT ?? 8080, '0.0.0.0')
}
bootstrap().catch((err: unknown) => {
  console.error('Error during bootstrap', err)
})
