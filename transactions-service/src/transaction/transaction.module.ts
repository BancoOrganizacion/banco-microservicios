import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaccion, TransaccionSchema } from './schemas/transaction.schema';
import { JwtDataGuard } from './middleware/jwt-data.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaccion.name, schema: TransaccionSchema }
    ]),
    ClientsModule.register([
      {
        name: 'ACCOUNTS_SERVICE',
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
  controllers: [TransactionController],
  providers: [TransactionService, JwtDataGuard],
  exports: [TransactionService]
})
export class TransactionModule {}