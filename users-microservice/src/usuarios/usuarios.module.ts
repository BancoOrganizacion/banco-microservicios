import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import {
  Usuario,
  UsuarioSchema,
  CuentaApp,
  CuentaAppSchema,
} from 'shared-models';
import { RolesModule } from '../roles/roles.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema },
      { name: CuentaApp.name, schema: CuentaAppSchema },
    ]),
    RolesModule,
    ClientsModule.register([
      {
        // Añadir esto
        name: 'AUTH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      },
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
