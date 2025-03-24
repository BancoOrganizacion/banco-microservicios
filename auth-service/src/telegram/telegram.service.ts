import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelegramChat } from './schemas/telegram-chat.schema';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(TelegramChat.name) private telegramChatModel: Model<TelegramChat>
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN not found in environment variables');
      return;
    }

    // Crear el bot con el token
    this.bot = new TelegramBot(token, { polling: false });
    this.logger.log('Telegram bot service initialized');
  }

  /**
   * Envía un mensaje a través de Telegram
   * @param chatId ID de chat o nombre de usuario de Telegram
   * @param message Mensaje a enviar
   * @returns Promise con el resultado del envío
   */
  async sendMessage(chatId: string, message: string): Promise<TelegramBot.Message> {
    try {
      const result = await this.bot.sendMessage(chatId, message);
      this.logger.log(`Message sent to ${chatId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send message to ${chatId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envía un código de verificación a un usuario a través de Telegram
   * @param chatId ID de chat o nombre de usuario de Telegram
   * @param code Código de verificación
   * @returns Promise con el resultado del envío
   */
  async sendVerificationCode(chatId: string, code: string): Promise<TelegramBot.Message> {
    const message = `Tu código de verificación es: ${code}\nEste código expirará en 15 minutos.`;
    return this.sendMessage(chatId, message);
  }

  /**
   * Registra o actualiza la asociación entre un número de teléfono y un ID de chat de Telegram
   * @param telefono Número de teléfono (formato ecuatoriano 09XXXXXXXX)
   * @param chatId ID de chat de Telegram
   * @returns La asociación creada o actualizada
   */
  async registerTelegramChat(telefono: string, chatId: string): Promise<TelegramChat> {
    try {
      // Buscar si ya existe una asociación para este teléfono
      let telegramChat = await this.telegramChatModel.findOne({ telefono });
      
      if (telegramChat) {
        // Actualizar el chatId si ya existe
        telegramChat.chatId = chatId;
        telegramChat.activo = true;
        return telegramChat.save();
      } else {
        // Crear nueva asociación
        telegramChat = new this.telegramChatModel({
          telefono,
          chatId,
          activo: true
        });
        return telegramChat.save();
      }
    } catch (error) {
      this.logger.error(`Error registering Telegram chat: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca el ID de chat de Telegram asociado a un número de teléfono
   * @param telefono Número de teléfono (formato ecuatoriano 09XXXXXXXX)
   * @returns El ID de chat de Telegram o null si no se encuentra
   */
  async findChatIdByPhone(telefono: string): Promise<string | null> {
    try {
      const telegramChat = await this.telegramChatModel.findOne({ 
        telefono, 
        activo: true 
      });
      
      return telegramChat ? telegramChat.chatId : null;
    } catch (error) {
      this.logger.error(`Error finding Telegram chat ID: ${error.message}`);
      return null;
    }
  }

  /**
   * Envía un código de verificación a un número de teléfono mediante Telegram
   * Primero busca el ID de chat asociado al número
   * @param telefono Número de teléfono (formato ecuatoriano 09XXXXXXXX)
   * @param code Código de verificación
   * @returns Promise con el resultado del envío o null si no se encuentra asociación
   */
  async sendVerificationCodeByPhone(telefono: string, code: string): Promise<TelegramBot.Message | null> {
    const chatId = await this.findChatIdByPhone(telefono);
    
    if (!chatId) {
      this.logger.warn(`No Telegram chat ID found for phone: ${telefono}`);
      return null;
    }
    
    return this.sendVerificationCode(chatId, code);
  }
}