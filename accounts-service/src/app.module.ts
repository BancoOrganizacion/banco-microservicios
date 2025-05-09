import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CuentasModule } from './cuentas/cuentas.module';
import { JwtDataMiddleware } from './cuentas/common/middleware/jwt-data.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.DATABASE_URI ||
        'mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin',
    ),
    CuentasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar el middleware a todas las rutas
    consumer.apply(JwtDataMiddleware).forRoutes('*');
  }
}
