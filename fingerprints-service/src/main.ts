import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule,DocumentBuilder } from '@nestjs/swagger';
import 'reflect-metadata'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //Swagger
  const config = new DocumentBuilder()
  .setTitle('Fingerprints service API')
  .setDescription('API para el servicio de huellas dactilares')
  .setVersion('1.0')
  .addTag('fingerprints')
  .build();

  const document = SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api',app,document)
  
  // Configuración global de pipes para validación
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));

  await app.listen(3003); // Usa un puerto diferente a tus otros servicios
  console.log(`Fingerprint service is running on: ${await app.getUrl()}`);
}
bootstrap();
