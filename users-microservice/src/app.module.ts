import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { JwtDataMiddleware } from './common/middleware/jwt-data.middleware';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:Banco123*@localhost:27018/bancodb?authSource=admin'),
    UsuariosModule,
    RolesModule,
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