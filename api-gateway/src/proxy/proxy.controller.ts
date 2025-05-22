// api-gateway/src/proxy/proxy.controller.ts
import { 
  Controller, 
  All, 
  Param,
  Get, 
  Post, 
  Put,
  Delete,
  Req, 
  Res, 
  HttpException, 
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiHeader
} from '@nestjs/swagger';

// Definimos un decorador para todos los métodos HTTP comunes
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  // Documentación para los endpoints de autenticación
  @ApiTags('auth')
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'usuario123' },
        password: { type: 'string', example: 'Contraseña123!' }
      },
      required: ['username', 'password']
    }
  })
  @ApiResponse({ status: 201, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @Post('auth/login')
  async authLogin(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('auth', req, res);
  }

  @ApiTags('auth')
  @ApiOperation({ summary: 'Generar código de verificación' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', example: 'login' }
      },
      required: ['tipo']
    }
  })
  @ApiResponse({ status: 201, description: 'Código generado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('auth/codigo/generar')
  async generateCode(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('auth', req, res);
  }

  @ApiTags('auth')
  @ApiOperation({ summary: 'Validar código de verificación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '6070f06d5c7b1a1a9c9b0b3a' },
        code: { type: 'string', example: '1234' }
      },
      required: ['userId', 'code']
    }
  })
  @ApiResponse({ status: 201, description: 'Validación exitosa' })
  @ApiResponse({ status: 400, description: 'Error en la validación' })
  @Post('auth/codigo/validar')
  async validateCode(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('auth', req, res);
  }

  @ApiTags('telegram')
  @ApiOperation({ summary: 'Generar enlace para Telegram' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Enlace generado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('auth/telegram/link')
  async generateTelegramLink(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('auth', req, res);
  }

  // Documentación para los endpoints de usuarios
  @ApiTags('users')
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        cedula: { type: 'string', example: '1712345678' },
        email: { type: 'string', example: 'juan.perez@example.com' },
        telefono: { type: 'string', example: '0991234567' },
        rol: { type: 'string', example: '6070f06d5c7b1a1a9c9b0b3a' },
        nombre_usuario: { type: 'string', example: 'juan_perez' },
        contraseña: { type: 'string', example: 'Abcd1234!' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  @Post('users/usuarios')
  async createUser(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @Get('users/usuarios')
  async getAllUsers(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del usuario' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @Get('users/usuarios/:id')
  async getUserById(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del usuario' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        email: { type: 'string', example: 'juan.perez@example.com' },
        telefono: { type: 'string', example: '0991234567' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @Put('users/usuarios/:id')
  async updateUser(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  // Endpoint para actualizar un usuario perfil
  @ApiTags('users')
  @ApiOperation({ summary: 'Actualizar usuario propio' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        email: { type: 'string', example: 'juan.perez@example.com' },
        telefono: { type: 'string', example: '0991234567' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Put('users/usuarios/perfil')
  async updateCurrentUser(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Actualizar rol de usuario' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del usuario' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rolId: { type: 'string', example: '6070f06d5c7b1a1a9c9b0b3a' }
      },
      required: ['rolId']
    }
  })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @Put('users/usuarios/:id/rol')
  async updateUserRole(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  // Endpoints de roles
  @ApiTags('users')
  @ApiOperation({ summary: 'Obtener todos los roles' })
  @ApiResponse({ status: 200, description: 'Lista de roles obtenida' })
  @Get('users/roles')
  async getAllRoles(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'admin' },
        descripcion: { type: 'string', example: 'Administrador del sistema' }
      },
      required: ['nombre']
    }
  })
  @ApiResponse({ status: 201, description: 'Rol creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El rol ya existe' })
  @Post('users/roles')
  async createRole(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del rol' })
  @ApiResponse({ status: 200, description: 'Rol encontrado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @Get('users/roles/:id')
  async getRoleById(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  @ApiTags('users')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID del rol' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', example: 'admin' },
        descripcion: { type: 'string', example: 'Administrador del sistema' },
        activo: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Rol actualizado' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'El nombre del rol ya está en uso' })
  @Put('users/roles/:id')
  async updateRole(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  // Método general para manejar las solicitudes de proxy (endpoints no documentados explícitamente)
  @All('auth/*')
  async proxyToAuth(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('auth', req, res);
  }

  @All('users/*')
  async proxyToUsers(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('users', req, res);
  }

  // Método general para manejar las solicitudes de proxy
  private async handleProxyRequest(service: string, req: Request, res: Response) {
    try {
      // Extraer la ruta específica del servicio (después de 'auth/' o 'users/')
      const path = req.url.split('/').slice(2).join('/');
      
      // Enviar la solicitud al microservicio correspondiente
      const result = await this.proxyService.forwardRequest(
        service,
        path,
        req.method,
        req.headers,
        req.body,
        req.query,
      );
      
      // Responder con el resultado del microservicio
      res.status(result.statusCode).json(result.data);
    } catch (error) {
      this.logger.error(`Error en proxy para ${service}: ${error.message}`);
      
      const status = error instanceof HttpException 
        ? error.getStatus() 
        : HttpStatus.INTERNAL_SERVER_ERROR;
        
      const message = error instanceof HttpException
        ? error.getResponse()
        : 'Error interno en el servidor';
        
      res.status(status).json({ 
        statusCode: status,
        message: message 
      });
    }
  }

  @All('accounts/*')
  async proxyToAccounts(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  @ApiTags('accounts')
  @ApiOperation({ summary: 'Crear una nueva cuenta bancaria' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        tipo_cuenta: { 
          type: 'string', 
          example: 'CORRIENTE',
          enum: ['CORRIENTE', 'AHORROS']
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Cuenta creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o el usuario ya tiene 2 cuentas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('accounts/cuentas')
  async createCuenta(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  @ApiTags('accounts')
  @ApiOperation({ summary: 'Obtener mis cuentas bancarias' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Lista de cuentas del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('accounts/cuentas/mis-cuentas')
  async getMisCuentas(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  @ApiTags('accounts')
  @ApiOperation({ summary: 'Obtener cuenta por número' })
  @ApiParam({ name: 'numeroCuenta', description: 'Número de cuenta (10 dígitos)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Cuenta encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('accounts/cuentas/numero/:numeroCuenta')
  async getCuentaPorNumero(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  @ApiTags('accounts')
  @ApiOperation({ summary: 'Cancelar una cuenta bancaria' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Cuenta cancelada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar una cuenta con saldo positivo' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Delete('accounts/cuentas/:id')
  async cancelarCuenta(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  @ApiTags('accounts')
  @ApiOperation({ summary: 'Obtener movimientos de una cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Lista de movimientos' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('accounts/cuentas/:id/movimientos')
  async getMovimientosCuenta(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }
  // Dentro de la clase ProxyController en proxy.controller.ts

  @ApiTags('accounts')
  @ApiOperation({ summary: 'Añadir una restricción a una cuenta' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        monto_desde: { type: 'number', example: 0 },
        monto_hasta: { type: 'number', example: 100 },
        patron_autenticacion: { type: 'string', example: '60d5ecb74e4e8d1b5cbf2457', nullable: true }
      },
      required: ['monto_desde', 'monto_hasta']
    }
  })
  @ApiResponse({ status: 200, description: 'Restricción añadida exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o rangos solapados' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @Post('accounts/cuentas/:id/restricciones')
  async addCuentaRestriccion(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  // También deberías agregar el endpoint para eliminar restricciones
  @ApiTags('accounts')
  @ApiOperation({ summary: 'Eliminar una restricción de una cuenta' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la cuenta' })
  @ApiParam({ name: 'restriccionId', type: 'string', description: 'ID de la restricción' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Restricción eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Cuenta o restricción no encontrada' })
  @Delete('accounts/cuentas/:id/restricciones/:restriccionId')
  async removeCuentaRestriccion(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  // Endpoint para obtener restricciones de una cuenta
  @ApiTags('accounts')
  @ApiOperation({ summary: 'Obtener restricciones de una cuenta' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Lista de restricciones' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @Get('accounts/cuentas/:id/restricciones')
  async getCuentaRestricciones(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }

  // Endpoint para actualizar una restricción
  @ApiTags('accounts')
  @ApiOperation({ summary: 'Actualizar una restricción de una cuenta' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID de la cuenta' })
  @ApiParam({ name: 'restriccionId', type: 'string', description: 'ID de la restricción' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        monto_desde: { type: 'number', example: 0 },
        monto_hasta: { type: 'number', example: 100 },
        patron_autenticacion: { type: 'string', example: '60d5ecb74e4e8d1b5cbf2457', nullable: true }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Restricción actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o rangos solapados' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Cuenta o restricción no encontrada' })
  @Put('accounts/cuentas/:id/restricciones/:restriccionId')
  async updateCuentaRestriccion(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('accounts', req, res);
  }
}