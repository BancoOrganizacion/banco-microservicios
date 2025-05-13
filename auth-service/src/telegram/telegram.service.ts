import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelegramChat } from 'shared-models';
import { TelegramToken } from 'shared-models';
import * as crypto from 'crypto';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(TelegramChat.name) private telegramChatModel: Model<TelegramChat>,
    @InjectModel(TelegramToken.name) private telegramTokenModel: Model<TelegramToken>
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN not found in environment variables');
      return;
    }

    // Crear el bot con el token
    this.bot = new TelegramBot(token, { polling: true });
    this.logger.log('Telegram bot service initialized');

    // Configurar el manejador para el comando /start con token
    this.bot.onText(/\/start (.+)/, this.handleStartCommand.bind(this));
  }

  /**
   * Maneja el comando /start cuando un usuario inicia el bot con un token
   * @param msg Mensaje de Telegram
   * @param match Resultado de la expresión regular
   */
  private async handleStartCommand(msg: TelegramBot.Message, match: RegExpExecArray) {
    const chatId = msg.chat.id.toString();
    const token = match[1];

    this.logger.log(`Received /start command with token: ${token} from chat ${chatId}`);

    try {
      // Buscar el token en la base de datos
      const tokenDoc = await this.telegramTokenModel.findOne({ 
        token, 
        usado: false,
        expiracion: { $gt: new Date() }
      });

      if (!tokenDoc) {
        await this.sendMessage(chatId, 'El enlace que has utilizado no es válido o ha expirado. Por favor, genera un nuevo enlace desde la aplicación.');
        return;
      }

      // Vincular el chat de Telegram con el usuario
      await this.registerTelegramChatByUserId(tokenDoc.usuario.toString(), chatId);

      // Marcar el token como usado
      tokenDoc.usado = true;
      await tokenDoc.save();

      // Enviar mensaje de confirmación
      await this.sendMessage(chatId, '¡Tu cuenta ha sido vinculada con éxito! Ahora recibirás los códigos de verificación a través de este chat de Telegram.');
    } catch (error) {
      this.logger.error(`Error processing start command: ${error.message}`);
      await this.sendMessage(chatId, 'Ha ocurrido un error al vincular tu cuenta. Por favor, intenta nuevamente más tarde.');
    }
  }

  /**
   * Genera un token único para vincular una cuenta de usuario con Telegram
   * @param userId ID del usuario en la base de datos
   * @returns Objeto con el token y el enlace profundo
   */
  async generateTelegramLinkToken(userId: string): Promise<{ token: string, deepLink: string }> {
    try {
      // Generar token aleatorio
      const token = crypto.randomBytes(16).toString('hex');
      
      // Establecer expiración (24 horas)
      const expiracion = new Date();
      expiracion.setHours(expiracion.getHours() + 24);

      // Guardar token en la base de datos
      const nuevoToken = new this.telegramTokenModel({
        usuario: userId,
        token,
        expiracion,
        usado: false
      });

      await nuevoToken.save();

      // Obtener el nombre del bot para el enlace profundo
      const botInfo = await this.bot.getMe();
      const botUsername = botInfo.username;

      // Crear enlace profundo
      const deepLink = `https://t.me/${botUsername}?start=${token}`;

      return { token, deepLink };
    } catch (error) {
      this.logger.error(`Error generating Telegram link token: ${error.message}`);
      throw error;
    }
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
   * Registra o actualiza la asociación entre un usuario y un ID de chat de Telegram
   * @param userId ID del usuario en la base de datos
   * @param chatId ID de chat de Telegram
   * @returns La asociación creada o actualizada
   */
  async registerTelegramChatByUserId(userId: string, chatId: string): Promise<TelegramChat> {
    try {
      // Buscar si ya existe una asociación para este usuario
      let telegramChat = await this.telegramChatModel.findOne({ usuario: userId });
      
      if (telegramChat) {
        // Actualizar el chatId si ya existe
        telegramChat.chatId = chatId;
        telegramChat.activo = true;
        return telegramChat.save();
      } else {
        // Crear nueva asociación
        telegramChat = new this.telegramChatModel({
          usuario: userId,
          chatId,
          activo: true
        });
        return telegramChat.save();
      }
    } catch (error) {
      this.logger.error(`Error registering Telegram chat by user ID: ${error.message}`);
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
      this.logger.error(`Error finding Telegram chat ID by phone: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca el ID de chat de Telegram asociado a un usuario
   * @param userId ID del usuario en la base de datos
   * @returns El ID de chat de Telegram o null si no se encuentra
   */
  async findChatIdByUserId(userId: string): Promise<string | null> {
    try {
      const telegramChat = await this.telegramChatModel.findOne({ 
        usuario: userId, 
        activo: true 
      });
      
      return telegramChat ? telegramChat.chatId : null;
    } catch (error) {
      this.logger.error(`Error finding Telegram chat ID by user ID: ${error.message}`);
      return null;
    }
  }

  /**
   * Envía un código de verificación a un usuario mediante Telegram usando su ID
   * @param userId ID del usuario en la base de datos
   * @param code Código de verificación
   * @returns Promise con el resultado del envío o null si no se encuentra asociación
   */
  async sendVerificationCodeByUserId(userId: string, code: string): Promise<TelegramBot.Message | null> {
    const chatId = await this.findChatIdByUserId(userId);
    
    if (!chatId) {
      this.logger.warn(`No Telegram chat ID found for user: ${userId}`);
      return null;
    }
    
    return this.sendVerificationCode(chatId, code);
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