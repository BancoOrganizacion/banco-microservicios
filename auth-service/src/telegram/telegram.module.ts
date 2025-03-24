import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramService } from './telegram.service';
import { TelegramChat, TelegramChatSchema } from './schemas/telegram-chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelegramChat.name, schema: TelegramChatSchema },
    ]),
  ],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}