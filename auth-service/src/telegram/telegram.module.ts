import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices'; // AGREGAR IMPORT
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramChat, TelegramChatSchema } from 'shared-models';
import { TelegramToken, TelegramTokenSchema } from 'shared-models';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelegramChat.name, schema: TelegramChatSchema },
      { name: TelegramToken.name, schema: TelegramTokenSchema },
    ]),
    // MOVER ClientsModule AQUÍ DENTRO DEL ARRAY imports
    ClientsModule.register([{
      name: 'USERS_SERVICE',
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      }
    }])
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}