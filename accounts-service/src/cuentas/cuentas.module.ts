import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CuentasController } from './cuentas.controller';
import { CuentasService } from './cuentas.service';
import { Cuenta, CuentaSchema, PatronAutenticacion, PatronAutenticacionSchema } from 'shared-models';
import { Transaccion,TransaccionSchema } from 'shared-models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cuenta.name, schema: CuentaSchema },
      {name: Transaccion.name,schema:TransaccionSchema},
      {name:PatronAutenticacion.name,schema:PatronAutenticacionSchema}
    ]),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        }
      },
      {
        name: 'AUTH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        }
      }
    ])
  ],
  controllers: [CuentasController],
  providers: [CuentasService],
  exports: [CuentasService]
})
export class CuentasModule {}