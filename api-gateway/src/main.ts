import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
<<<<<<< HEAD
  app.enableCors();
=======
>>>>>>> f172acded509c085c9fad23525507d8d09cb30c0
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
