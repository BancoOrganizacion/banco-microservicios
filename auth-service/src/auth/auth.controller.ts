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
import { GetUserByCodeDto } from 'shared-models';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessagePattern } from '@nestjs/microservices';
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
import { RoleGuard } from './guards/role.guard';
import { Roles } from './common/decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
  ) { }

  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    description: 'Login exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const token = await this.authService.validateUser(loginDto.username, loginDto.password);
      return { access_token: token };
    } catch (error) {
      throw new HttpException('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
    }
  }

  @ApiOperation({ summary: 'Generar código de verificación' })
  @ApiBody({ type: RegisterCodeDto })
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({
    description: 'Código generado exitosamente',
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: '1234'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBadRequestResponse({ description: 'Error al generar código' })
  @UseGuards(JwtAuthGuard)
  @Post('codigo/generar')
  async generateRegistrationCode(@Body() registerCodeDto: RegisterCodeDto, @Request() req) {
    try {
      const userId = req.user?.id_usuario;

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

  @ApiOperation({ summary: 'Validar código de verificación' })
  @ApiBody({ type: ValidateCodeDto })
  @ApiCreatedResponse({
    description: 'Resultado de la validación',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          example: true
        },
        message: {
          type: 'string',
          example: 'Código válido'
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Error al validar código' })
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

  // Este método es para mensajes internos, no se expone en Swagger
  @MessagePattern('auth.generateTokenAfterRegistration')
  async generateTokenAfterRegistration(data: { username: string, userId: string, rolId: string }) {
    try {
      const token = await this.authService.generateTokenForNewUser(data.userId, data.rolId);
      return { access_token: token };
    } catch (error) {
      this.logger.error(`Error al generar token después del registro: ${error.message}`);
      throw new Error('No se pudo generar el token después del registro');
    }
  }

  @ApiOperation({ summary: 'Obtener ID de usuario a partir de un código' })
  @ApiBody({ type: GetUserByCodeDto })
  @ApiCreatedResponse({ 
    description: 'ID de usuario obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '60d5ecb74e4e8d1b5cbf2457'
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Código inválido o expirado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @Post('codigo/usuario')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard,RoleGuard)
  @Roles('6807f1cb168fadf2ecd43c4d')
  async getUserByCode(@Body() getUserByCodeDto: GetUserByCodeDto) {
    try {
      const userId = await this.authService.getUserIdFromCode(getUserByCodeDto.code);
      
      if (!userId) {
        throw new HttpException(
          'Código inválido o expirado', 
          HttpStatus.BAD_REQUEST
        );
      }
      
      return { userId };
    } catch (error) {
      this.logger.error(`Error al obtener usuario por código: ${error.message}`);
      throw new HttpException(
        error.message || 'Error al procesar el código', 
        HttpStatus.BAD_REQUEST
      );
    }
  }

}

