// api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors();

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription(
      'API Gateway que orquesta todos los microservicios del sistema',
    )
    .setVersion('1.0')
    .addTag('gateway', 'Endpoints del API Gateway')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('users', 'Endpoints de usuarios')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API Gateway está ejecutándose en: ${await app.getUrl()}`);
  logger.log(
    `Swagger documentation is available at: ${await app.getUrl()}/api/docs`,
  );
}
bootstrap();
