import { 
  Controller, 
  Post,
  Get, 
  Body, 
  HttpException, 
  HttpStatus, 
  UseGuards,
  Request,
  Logger
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'shared-models';
import { RegisterCodeDto } from 'shared-models';
import { ValidateCodeDto } from 'shared-models';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
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
  @Post('codigo/generar')
  async generateRegistrationCode(@Body() registerCodeDto: RegisterCodeDto, @Request() req) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        this.logger.error('ID de usuario no disponible en el token JWT');
        throw new HttpException(
          'ID de usuario no disponible en el token JWT', 
          HttpStatus.BAD_REQUEST
        );
      }

      const code = await this.authService.generateRegistrationCode(userId, registerCodeDto.tipo);
      return { code };
    } catch (error) {
      this.logger.error(`Error al generar código: ${error.message}`);
      throw new HttpException(
        error.message || 'Error al generar el código de registro', 
        HttpStatus.BAD_REQUEST
      );
    }
  }
    
  @Post('codigo/validar')
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
}