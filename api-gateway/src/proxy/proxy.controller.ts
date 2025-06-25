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
  Patch,
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
  ApiHeader,
  ApiQuery
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
      // Extraer la ruta específica del servicio
      let path = req.url.split('/').slice(2).join('/');
      
      // Caso especial para fingerprints: agregar el prefijo 'fingerprint'
      if (service === 'fingerprints') {
        path = `fingerprint/${path}`;
      }
      
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
@ApiOperation({ summary: 'Obtener movimientos de cuentas' })
@ApiBearerAuth('JWT-auth')
@ApiResponse({ status: 200, description: 'Lista de movimientos' })
@ApiResponse({ status: 404, description: 'Movimientos no encontrados' })
@ApiResponse({ status: 401, description: 'No autorizado' })
@Get('accounts/cuentas/movimientos')
async getMovimientosCuenta(@Req() req: Request, @Res() res: Response) {
  return this.handleProxyRequest('accounts', req, res);
}

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

  // ========================= ENDPOINTS DE PATRONES =========================
  
  @ApiTags('patterns')
  @ApiOperation({ summary: 'Crear nuevo patrón de autenticación' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dedosPatronIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array de IDs de dedos patrón para crear el patrón de autenticación',
          example: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456', 'dedo_medio_izquierdo_789'],
          minItems: 1
        }
      },
      required: ['dedosPatronIds']
    }
  })
  @ApiResponse({ status: 201, description: 'Patrón creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o incompletos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('patterns')
  async crearPatron(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  @ApiTags('patterns')
  @ApiOperation({ summary: 'Obtener patrón por ID' })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Patrón encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Patrón no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('patterns/:id')
  async obtenerPatron(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  @ApiTags('patterns')
  @ApiOperation({ summary: 'Obtener dedos patrón' })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Dedos patrón obtenidos exitosamente',
    schema: {
      example: {
        dedos: [
          {
            id: 'dedo_pulgar_derecho_123',
            nombre: 'Pulgar derecho',
            template: 'Rk1SACAyMAAAAAFgAAABPQFhAMUAxQEAAAAnYQC1...',
            calidad: 85
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Patrón no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('patterns/:id/dedos')
  async obtenerDedosPatron(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  @ApiTags('patterns')
  @ApiOperation({ summary: 'Obtener patterns por cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Patrones obtenidos exitosamente',
    schema: {
      example: [
        {
          id: 'patron_abc123def456',
          idCuentaApp: 'cuenta_usuario_789',
          dedosPatronIds: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456'],
          activo: true,
          fechaCreacion: '2025-05-29T10:30:00.000Z',
          fechaActualizacion: '2025-05-29T10:30:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('patterns')
  async obtenerPatronesPorCuenta(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  @ApiTags('patterns')
  @ApiOperation({ summary: 'Cambiar estado del patrón' })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        activo: {
          type: 'boolean',
          description: 'Nuevo estado del patrón (true = activo, false = inactivo)',
          example: true
        }
      },
      required: ['activo']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del patrón actualizado exitosamente',
    schema: {
      example: {
        id: 'patron_abc123def456',
        activo: false,
        mensaje: 'Estado del patrón actualizado correctamente'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Patrón no encontrado' })
  @ApiResponse({ status: 400, description: 'Valor del parámetro "activo" inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Patch('patterns/:id/estado')
  async cambiarEstadoPatron(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  @ApiTags('patterns')
  @ApiOperation({ summary: 'Validar patrón para autenticación' })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Validación completada exitosamente',
    schema: {
      example: { valido: true }
    }
  })
  @ApiResponse({ status: 404, description: 'Patrón no encontrado' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('patterns/:id/validar')
  async validarPatron(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  @ApiTags('patterns')
  @ApiOperation({ summary: 'Obtener información para autenticación' })
  @ApiParam({ 
    name: 'id', 
    type: 'string', 
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Información de autenticación obtenida exitosamente',
    schema: {
      example: {
        patron: {
          id: 'patron_abc123def456',
          idCuentaApp: 'cuenta_usuario_789',
          activo: true,
          dedosPatronIds: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456']
        },
        templates: [
          {
            id: 'dedo_pulgar_derecho_123',
            nombre: 'Pulgar derecho',
            template: 'Rk1SACAyMAAAAAFgAAABPQFhAMUAxQEAAAAnYQC1...',
            calidad: 85
          }
        ],
        metadatos: {
          algoritmo: 'ISO_19794_2',
          version: '2.0',
          fechaGeneracion: '2025-05-29T10:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Patrón no encontrado o no disponible para autenticación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('patterns/:id/autenticacion')
  async obtenerPatronParaAutenticacion(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patrones', req, res);
  }

  // Catch-all para otros endpoints de patrones
  @All('patterns/*')
  async proxyToPatrones(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('patterns', req, res);
  }

  // ========================= FIN ENDPOINTS DE PATRONES =========================


  // Documentación para los endpoints de fingerprints
  @ApiTags('fingerprints')
  @ApiOperation({ summary: 'Registrar una huella digital' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dedo: {
          type: 'string',
          description: 'Tipo de dedo',
          enum: ['PULGAR_DERECHO', 'INDICE_DERECHO', 'MEDIO_DERECHO', 'ANULAR_DERECHO', 'MENIQUE_DERECHO', 
                 'PULGAR_IZQUIERDO', 'INDICE_IZQUIERDO', 'MEDIO_IZQUIERDO', 'ANULAR_IZQUIERDO', 'MENIQUE_IZQUIERDO'],
          example: 'INDICE_DERECHO'
        },
        huella: {
          type: 'string',
          description: 'Datos de la huella digital en formato string',
          example: 'base64_encoded_fingerprint_data'
        }
      },
      required: ['dedo', 'huella']
    }
  })
  @ApiResponse({ status: 201, description: 'Huella registrada con éxito' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @Post('fingerprints/register')
  async registerFinger(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('fingerprints', req, res);
  }

  @ApiTags('fingerprints')
  @ApiOperation({ summary: 'Crear un patrón de huella digital' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          description: 'Nombre del patrón',
          example: 'Patrón de acceso principal'
        },
        descripcion: {
          type: 'string',
          description: 'Descripción del patrón',
          example: 'Patrón utilizado para transacciones de alto valor'
        },
        dedos: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Array de IDs de huellas que forman el patrón',
          example: ['60d5ecb74e4e8d1b5cbf2457', '60d5ecb74e4e8d1b5cbf2458']
        }
      },
      required: ['nombre', 'dedos']
    }
  })
  @ApiResponse({ status: 201, description: 'Patrón de huella creado con éxito' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @Post('fingerprints/pattern')
  async createPattern(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('fingerprints', req, res);
  }

  @ApiTags('fingerprints')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener dedos registrados por cuenta' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_cuenta_app: {
          type: 'string',
          description: 'ID de la cuenta asociada',
          example: '60d5ecb74e4e8d1b5cbf2459'
        }
      },
      required: ['id_cuenta_app']
    }
  })
  @ApiResponse({ status: 200, description: 'Dedos registrados encontrados' })
  @ApiResponse({ status: 400, description: 'ID inválido o no se encontraron dedos' })
  @Post('fingerprints/get-fingers')
  async getFingersByAccount(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('fingerprints', req, res);
  }

  @All('fingerprints/*')
  async proxyToFingerprints(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('fingerprints', req, res);
  }

  // ========================= ENDPOINTS DE TRANSACCIONES =========================
  
   @ApiTags('transacciones')
  @ApiOperation({ summary: 'Realizar transferencia entre cuentas usando números de cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        numero_cuenta_origen: {
          type: 'string',
          description: 'Número de cuenta origen (10 dígitos)',
          example: '1234567890',
          minLength: 10,
          maxLength: 10
        },
        numero_cuenta_destino: {
          type: 'string',
          description: 'Número de cuenta destino (10 dígitos)',
          example: '0987654321',
          minLength: 10,
          maxLength: 10
        },
        monto: {
          type: 'number',
          description: 'Monto a transferir',
          example: 100.50,
          minimum: 0.01
        },
        descripcion: {
          type: 'string',
          description: 'Descripción de la transferencia',
          example: 'Pago de servicios'
        }
      },
      required: ['numero_cuenta_origen', 'numero_cuenta_destino', 'monto']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Transferencia creada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Transferencia procesada exitosamente',
        transaccion: {
          _id: '507f1f77bcf86cd799439020',
          numero_transaccion: 'TXN-1234567890-1234',
          tipo: 'TRANSFERENCIA',
          monto: 100.50,
          estado: 'COMPLETADA',
          requiere_autenticacion: false,
          fecha_creacion: '2025-06-01T10:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos inválidos o saldo insuficiente',
    schema: {
      example: {
        statusCode: 400,
        message: 'Saldo insuficiente para realizar la transferencia',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('transactions/transacciones/transferir')
  async transferir(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('transactions', req, res);
  }

  @ApiTags('transacciones')
  @ApiOperation({ summary: 'Consultar historial de transferencias' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Historial de transferencias obtenido',
    schema: {
      example: {
        transacciones: [
          {
            _id: '507f1f77bcf86cd799439020',
            numero_transaccion: 'TXN-1234567890-1234',
            tipo: 'TRANSFERENCIA',
            monto: 100.50,
            estado: 'COMPLETADA',
            cuenta_origen_numero: '1234567890',
            cuenta_destino_numero: '0987654321',
            fecha_creacion: '2025-06-01T10:30:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('transactions/transacciones/transferencias')
  async obtenerTransferencias(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('transactions', req, res);
  }

  @ApiTags('transacciones')
  @ApiOperation({ summary: 'Obtener detalles de una transferencia específica' })
  @ApiParam({ name: 'id', description: 'ID de la transferencia' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Detalles de la transferencia',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439020',
        numero_transaccion: 'TXN-1234567890-1234',
        tipo: 'TRANSFERENCIA',
        monto: 100.50,
        estado: 'COMPLETADA',
        cuenta_origen_numero: '1234567890',
        cuenta_destino_numero: '0987654321',
        descripcion: 'Pago de servicios',
        fecha_creacion: '2025-06-01T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('transactions/transacciones/transferencias/:id')
  async obtenerTransferenciaPorId(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('transactions', req, res);
  }

  @ApiTags('transacciones')
  @ApiOperation({ summary: 'Validar si una transferencia es posible usando números de cuenta' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        numero_cuenta_origen: {
          type: 'string',
          description: 'Número de cuenta origen (10 dígitos)',
          example: '1234567890',
          minLength: 10,
          maxLength: 10
        },
        monto: {
          type: 'number',
          description: 'Monto de la transferencia',
          example: 1500.00,
          minimum: 0.01
        },
        numero_cuenta_destino: {
          type: 'string',
          description: 'Número de cuenta destino (10 dígitos)',
          example: '0987654321',
          minLength: 10,
          maxLength: 10
        }
      },
      required: ['numero_cuenta_origen', 'monto', 'numero_cuenta_destino']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la validación',
    schema: {
      example: {
        es_valida: true,
        validaciones: {
          saldo_suficiente: true,
          cuenta_activa: true,
          cuenta_destino_activa: true,
          monto_valido: true,
          monto_total: 1500.00
        },
        restricciones: {
          requiere_autenticacion: true,
          patron_requerido: '507f1f77bcf86cd799439030'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('transactions/transacciones/validar')
  async validarTransaccion(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('transactions', req, res);
  }

  @ApiTags('transacciones')
  @ApiOperation({ summary: 'Verificar restricciones para un monto usando número de cuenta' })
  @ApiParam({ 
    name: 'numeroCuenta', 
    description: 'Número de cuenta (10 dígitos)',
    example: '1234567890'
  })
  @ApiParam({ 
    name: 'monto', 
    description: 'Monto a verificar',
    example: '1500.00'
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ 
    status: 200, 
    description: 'Información sobre restricciones aplicables',
    schema: {
      example: {
        numero_cuenta: '1234567890',
        monto_consultado: 1500.00,
        requiere_autenticacion: true,
        restriccion_aplicable: {
          monto_desde: 1000,
          monto_hasta: 5000,
          patron_autenticacion: '507f1f77bcf86cd799439030'
        },
        patron_requerido: '507f1f77bcf86cd799439030'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Get('transactions/transacciones/restricciones/:numeroCuenta/:monto')
  async verificarRestricciones(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('transactions', req, res);
  }

  @ApiTags('transacciones')
  @ApiOperation({ summary: 'Autorizar transacción con autenticación biométrica' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transaccion_id: {
          type: 'string',
          description: 'ID de la transacción a autorizar',
          example: '507f1f77bcf86cd799439013'
        },
        codigo_verificacion: {
          type: 'string',
          description: 'Código de verificación',
          example: '1234'
        },
        patron_autenticacion_id: {
          type: 'string',
          description: 'ID del patrón de autenticación usado',
          example: '507f1f77bcf86cd799439014'
        }
      },
      required: ['transaccion_id', 'codigo_verificacion']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Transacción autorizada y procesada',
    schema: {
      example: {
        success: true,
        message: 'Transacción autorizada y procesada exitosamente',
        transaccion: {
          _id: '507f1f77bcf86cd799439013',
          numero_transaccion: 'TXN-1234567890-1235',
          estado: 'COMPLETADA',
          fecha_autorizacion: '2025-06-01T10:35:00.000Z',
          fecha_procesamiento: '2025-06-01T10:35:30.000Z'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Código inválido o transacción no válida' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Post('transactions/transacciones/autorizar')
  async autorizarTransaccion(@Req() req: Request, @Res() res: Response) {
    return this.handleProxyRequest('transactions', req, res);
  }
}