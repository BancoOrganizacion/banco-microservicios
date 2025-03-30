import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// auth-service/src/main.ts
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar para escuchar mensajes de Redis
  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    }
  };
  
  app.connectMicroservice(microserviceOptions);
  await app.startAllMicroservices();
  
  await app.listen(3002);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();