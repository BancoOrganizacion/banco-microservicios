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
  import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
  import { UsuariosService } from '../../../users-microservice/src/usuarios/usuarios.service';

  
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
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
  }