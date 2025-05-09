import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
