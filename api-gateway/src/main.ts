// api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(); // Habilitar CORS para el frontend
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API Gateway está ejecutándose en: ${await app.getUrl()}`);
}
bootstrap();