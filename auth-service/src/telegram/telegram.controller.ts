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
  import { GenerateTelegramLinkDto } from './dto/generate-telegram-link.dto';
  import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
  
  @Controller('telegram')
  export class TelegramController {
    private readonly logger = new Logger(TelegramController.name);
  
    constructor(private readonly telegramService: TelegramService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post('link')
    async generateTelegramLink(@Request() req) {
      try {
        const userId = req.user.userId;
        
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
  }