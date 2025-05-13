// auth-service/src/telegram/telegram.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  Logger
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse
} from '@nestjs/swagger';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly telegramService: TelegramService) { }

  @ApiOperation({ summary: 'Generar enlace para vincular Telegram' })
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({
    description: 'Enlace generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        token: {
          type: 'string',
          example: 'a1b2c3d4e5f6g7h8i9j0'
        },
        deepLink: {
          type: 'string',
          example: 'https://t.me/MiBot?start=a1b2c3d4e5f6g7h8i9j0'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBadRequestResponse({ description: 'Error al generar enlace' })
  @UseGuards(JwtAuthGuard)
  @Post('link')
  async generateTelegramLink(@Request() req) {
    try {
      const userId = req.user.id_usuario;

      if (!userId) {
        throw new HttpException(
          'ID de usuario no disponible en el token JWT',
          HttpStatus.BAD_REQUEST
        );
      }

      const linkData = await this.telegramService.generateTelegramLinkToken(userId);

      return {
        success: true,
        token: linkData.token,
        deepLink: linkData.deepLink
      };
    } catch (error) {
      this.logger.error(`Error generating Telegram link: ${error.message}`);
      throw new HttpException(
        error.message || 'Error al generar enlace de Telegram',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({
    summary: 'Probar envío de mensajes Telegram',
    description: 'Endpoint para pruebas de integración con Telegram'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chatId: {
          type: 'string',
          example: '123456789'
        },
        message: {
          type: 'string',
          example: 'Mensaje de prueba'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Mensaje enviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        message: {
          type: 'string',
          example: 'Mensaje enviado con éxito'
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Error al enviar mensaje' })
  @Post('test')
  async testTelegramMessage(@Body() data: { chatId: string, message: string }) {
    try {
      await this.telegramService.sendMessage(data.chatId, data.message);
      return {
        success: true,
        message: 'Mensaje enviado con éxito'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al enviar mensaje por Telegram',
        HttpStatus.BAD_REQUEST
      );
    }
  }
  @ApiOperation({ summary: 'Buscar chatId de Telegram por número de teléfono' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telefono: {
          type: 'string',
          example: '+573001234567'
        }
      },
      required: ['telefono']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'ChatId encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        chatId: {
          type: 'string',
          example: '123456789',
          nullable: true
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBadRequestResponse({ description: 'Error en la búsqueda o parámetros inválidos' })
  @Post('find-chat-id')
  async findChatIdByPhone(@Body() data: { telefono: string }) {
    try {
      if (!data.telefono) {
        throw new HttpException(
          'El número de teléfono es requerido',
          HttpStatus.BAD_REQUEST
        );
      }

      const chatId = await this.telegramService.findChatIdByPhone(data.telefono);

      return {
        success: true,
        chatId
      };
    } catch (error) {
      this.logger.error(`Error finding chatId by phone: ${error.message}`);
      throw new HttpException(
        error.message || 'Error al buscar el chatId de Telegram',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @ApiOperation({ summary: 'Verificar si el usuario tiene un chat de Telegram vinculado' })
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({
    description: 'Resultado de la verificación',
    schema: {
      type: 'object',
      properties: {
        linked: {
          type: 'boolean',
          example: true
        },
        chatId: {
          type: 'string',
          example: '123456789',
          nullable: true
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @UseGuards(JwtAuthGuard)
  @Post('check-chat')
  async checkTelegramChatId(@Request() req) {
    try {
      const userId = req.user.id_usuario;

      if (!userId) {
        throw new HttpException(
          'ID de usuario no disponible en el token JWT',
          HttpStatus.BAD_REQUEST
        );
      }

      const chatId = await this.telegramService.findChatIdByUserId(userId);

      return {
        linked: !!chatId,
        chatId: chatId
      };
    } catch (error) {
      this.logger.error(`Error checking Telegram chat: ${error.message}`);
      throw new HttpException(
        error.message || 'Error al verificar el chat de Telegram',
        HttpStatus.BAD_REQUEST
      );
    }
  }


}