import { 
  Controller, 
  Post,
  Get, 
  Body, 
  HttpException, 
  HttpStatus, 
  UseGuards,
  Request
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterCodeDto } from './dto/register-code.dto';
import { ValidateCodeDto } from './dto/validate-code.dto';
import { RegisterTelegramDto } from '../telegram/dto/register-telegram.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TelegramService } from '../telegram/telegram.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramService: TelegramService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const token = await this.authService.validateUser(loginDto.username, loginDto.password);
      return { access_token: token };
    } catch (error) {
      throw new HttpException('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('registro')
  async generateRegistrationCode(@Body() registerCodeDto: RegisterCodeDto, @Request() req) {
    try {
      const code = await this.authService.generateRegistrationCode(req.user.userId, registerCodeDto.tipo);
      return { code };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al generar el código de registro', 
        HttpStatus.BAD_REQUEST
      );
    }
  }
    
  @Post('registro/validar')
  async validateRegistrationCode(@Body() validateCodeDto: ValidateCodeDto) {
    try {
      const isValid = await this.authService.validateRegistrationCode(
        validateCodeDto.userId,
        validateCodeDto.code
      );
      
      return { 
        valid: isValid,
        message: isValid ? 'Código válido' : 'Código inválido o expirado'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al validar el código', 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('telegram/register')
  async registerTelegramChat(@Body() registerTelegramDto: RegisterTelegramDto) {
    try {
      // Registramos la asociación entre el teléfono y el chat ID
      await this.telegramService.registerTelegramChat(
        registerTelegramDto.telefono, 
        registerTelegramDto.chatId
      );
      
      // Enviamos un mensaje de confirmación
      const message = 'Tu cuenta ha sido vinculada con éxito a nuestro servicio. Recibirás códigos de verificación a través de este chat.';
      await this.telegramService.sendMessage(registerTelegramDto.chatId, message);
      
      return { 
        success: true,
        message: 'Chat de Telegram registrado con éxito'
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al registrar el chat de Telegram', 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('telegram/test')
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