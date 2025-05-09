// users-microservice/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para desarrollo
  app.enableCors();

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Users Microservice API')
    .setDescription('API para la gestión de usuarios y roles del sistema')
    .setVersion('1.0')
    .addTag('usuarios', 'Endpoints de gestión de usuarios')
    .addTag('roles', 'Endpoints de gestión de roles')
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

  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
  };

  // Configuración global de pipes para validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.connectMicroservice(microserviceOptions);
  await app.startAllMicroservices();
  logger.log('Microservicio de usuarios iniciado');

  await app.listen(3001);
  logger.log(`Users Service running at: ${await app.getUrl()}`);
  logger.log(
    `Swagger documentation is available at: ${await app.getUrl()}/api/docs`,
  );
}
bootstrap();
