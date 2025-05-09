import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para desarrollo
  app.enableCors();

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Accounts Microservice API')
    .setDescription(
      'API para la gestión de cuentas bancarias y sus restricciones',
    )
    .setVersion('1.0')
    .addTag('cuentas', 'Endpoints de gestión de cuentas bancarias')
    .addTag('status', 'Endpoints de estado del servicio')
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

  // Conectar como microservicio para comunicación interna
  app.connectMicroservice(microserviceOptions);
  await app.startAllMicroservices();
  logger.log('Microservicio de cuentas iniciado');

  // Puerto del servicio HTTP
  await app.listen(3003);
  logger.log(`Accounts Service running at: ${await app.getUrl()}`);
  logger.log(
    `Swagger documentation is available at: ${await app.getUrl()}/api/docs`,
  );
}
bootstrap();
