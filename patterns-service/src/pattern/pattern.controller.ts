import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  ParseBoolPipe,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
  ForbiddenException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PatternService } from './pattern.service';
import { PatronAutenticacion } from 'shared-models';
import {
  CrearPatronDto,
  PatronAutenticacionResponse,
  DedosPatronResponse,
  ValidacionPatronResponse,
  EstadoPatronResponse,
  AutenticacionPatronResponse,
} from 'shared-models';
import { JwtDataGuard } from 'src/guards/jwt-data.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';

@ApiTags('patterns')
@Controller('patterns')
@ApiBearerAuth('JWT-auth') // Para cuando implementes JWT
@UseGuards(JwtDataGuard)
@UsePipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}))
export class PatternController {
  constructor(private readonly patternService: PatternService) { }

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo patrón de autenticación',
    description: 'Crea un nuevo patrón de autenticación biométrica. El ID de cuenta se obtiene del JWT.',
  })
  @ApiBody({
    type: CrearPatronDto,
    description: 'Datos necesarios para crear el patrón',
    examples: {
      ejemplo1: {
        summary: 'Patrón con 3 dedos',
        value: {
          nombre: 'Patrón Principal',
          dedosPatronIds: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456', 'dedo_medio_izquierdo_789']
        }
      },
      ejemplo2: {
        summary: 'Patrón con 2 dedos',
        value: {
          nombre: 'Patrón Secundario',
          dedosPatronIds: ['dedo_pulgar_izquierdo_abc', 'dedo_anular_derecho_def']
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Patrón creado exitosamente',
    type: PatronAutenticacionResponse,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o incompletos',
    schema: {
      example: {
        statusCode: 400,
        message: ['dedosPatronIds debe ser un array', 'dedosPatronIds no puede estar vacío'],
        error: 'Bad Request',
        timestamp: '2025-05-29T10:30:00.000Z',
        path: '/patterns'
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
        timestamp: '2025-05-29T10:30:00.000Z'
      }
    }
  })

  async crearPatron(
    @Body() crearPatronDto: CrearPatronDto,
    @Request() req: any // req.user.idCuentaApp
  ): Promise<PatronAutenticacion> {
    const { nombre, dedosPatronIds } = crearPatronDto;

    // Temporal: simular idCuentaApp hasta implementar JWT
    const idUsuario = req.user?.id_usuario;

    return this.patternService.crearPatronAutenticacion(idUsuario, nombre, dedosPatronIds);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener patrón por ID',
    description: 'Obtiene la información completa de un patrón de autenticación específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
    schema: { type: 'string' }
  })
  @ApiOkResponse({
    description: 'Patrón encontrado exitosamente',
    type: PatronAutenticacionResponse,
  })
  @ApiNotFoundResponse({
    description: 'Patrón no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Patrón con ID patron_abc123def456 no encontrado',
        error: 'Not Found',
        timestamp: '2025-05-29T10:30:00.000Z',
        path: '/patterns/patron_abc123def456'
      },
    },
  })
  async obtenerPatron(@Param('id') patronId: string): Promise<PatronAutenticacion> {
    return this.patternService.obtenerPatronPorId(patronId);
  }

  @Get(':id/dedos')
  @ApiOperation({
    summary: 'Obtener dedos patrón',
    description: 'Obtiene la información de los dedos patrón asociados a un patrón específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
  })
  @ApiOkResponse({
    description: 'Dedos patrón obtenidos exitosamente',
    type: DedosPatronResponse,
  })
  @ApiNotFoundResponse({
    description: 'Patrón no encontrado',
  })
  async obtenerDedos(@Param('id') patronId: string) {
    return this.patternService.obtenerDedosPatron(patronId);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener patrones por cuenta',
    description: 'Obtiene todos los patrones activos de una cuenta. La cuenta se obtiene del JWT.',
  })
  @ApiQuery({
    name: 'cuenta',
    description: 'ID de la cuenta (TEMPORAL: se removerá al implementar JWT)',
    required: false,
    example: 'cuenta_usuario_789',
    schema: {
      type: 'string',
      deprecated: true
    }
  })
  @ApiOkResponse({
    description: 'Patrones obtenidos exitosamente',
    type: [PatronAutenticacionResponse],
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
  @ApiBadRequestResponse({
    description: 'Parámetro de cuenta requerido (temporal hasta implementar JWT)',
    schema: {
      example: {
        statusCode: 400,
        message: 'El parámetro "cuenta" es obligatorio hasta implementar JWT',
        error: 'Bad Request'
      }
    }
  })
  async obtenerPatronesPorCuenta(
    @Query('userId') userId?: string,
    @Request() req?: any
  ) {
    // Temporal: validar que se envíe cuenta hasta implementar JWT
    const idUsuario = req.user.id_usuario;

    return this.patternService.obtenerPatronesPorCuenta(idUsuario);
  }

  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar estado del patrón',
    description: 'Activa o desactiva un patrón de autenticación específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
  })
  @ApiQuery({
    name: 'activo',
    description: 'Nuevo estado del patrón (true = activo, false = inactivo)',
    type: Boolean,
    example: true,
    schema: { type: 'boolean' }
  })
  @ApiOkResponse({
    description: 'Estado del patrón actualizado exitosamente',
    type: EstadoPatronResponse,
    schema: {
      example: {
        id: 'patron_abc123def456',
        activo: false,
        mensaje: 'Estado del patrón actualizado correctamente'
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Patrón no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Valor del parámetro "activo" inválido',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (boolean string is expected)',
        error: 'Bad Request'
      }
    }
  })
  async cambiarEstado(
    @Param('id') patronId: string,
    @Query('activo', ParseBoolPipe) activo: boolean,
  ) {
    return this.patternService.cambiarEstadoPatron(patronId, activo);
  }

  @Get(':id/validar')
  @ApiOperation({
    summary: 'Validar patrón para autenticación',
    description: 'Verifica si un patrón está disponible y válido para ser usado en autenticación',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
  })
  @ApiOkResponse({
    description: 'Validación completada exitosamente',
    type: ValidacionPatronResponse,
    schema: {
      example: { valido: true }
    }
  })
  @ApiNotFoundResponse({
    description: 'Patrón no encontrado',
  })
  async validarPatron(@Param('id') patronId: string): Promise<{ valido: boolean }> {
    const valido = await this.patternService.validarPatronParaAutenticacion(patronId);
    return { valido };
  }

  @Get(':id/autenticacion')
  @ApiOperation({
    summary: 'Obtener información para autenticación',
    description: 'Obtiene toda la información necesaria de un patrón para realizar el proceso de autenticación',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
  })
  @ApiOkResponse({
    description: 'Información de autenticación obtenida exitosamente',
    type: AutenticacionPatronResponse,
  })
  @ApiNotFoundResponse({
    description: 'Patrón no encontrado o no disponible para autenticación',
  })
  async obtenerParaAutenticacion(@Param('id') patronId: string) {
    return this.patternService.obtenerPatronParaAutenticacion(patronId);
  }

  @Get(':id/basico')
  @ApiOperation({
    summary: 'Obtener información básica del patrón',
    description: 'Obtiene solo la información básica de un patrón (nombre, fecha, estado) sin detalles complejos',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
    schema: { type: 'string' }
  })
  @ApiOkResponse({
    description: 'Información básica del patrón obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: 'patron_abc123def456' },
        nombre: { type: 'string', example: 'Patrón Principal' },
        fecha_creacion: { type: 'string', format: 'date-time' },
        activo: { type: 'boolean', example: true },
        cantidadDedos: { type: 'number', example: 3 }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Patrón no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Patrón con ID patron_abc123def456 no encontrado',
        error: 'Not Found',
        timestamp: '2025-05-29T10:30:00.000Z',
        path: '/patterns/patron_abc123def456/basico'
      },
    },
  })
  async obtenerPatronBasico(@Param('id') patronId: string): Promise<{
    _id: string;
    nombre: string;
    fecha_creacion: Date;
    activo: boolean;
    cantidadDedos: number;
  }> {
    return this.patternService.obtenerPatronBasico(patronId);
  }
  @Post('validar-compra')
@UseGuards(JwtDataGuard, RoleGuard) // ✅ PROTECCIÓN CON JWT Y ROL
@Roles('681144a24ea765b9fe824070') // ✅ SOLO ROL VINCULADOR
@ApiOperation({ summary: 'Validar compra con patrón de huellas (solo rol vinculador)' })
@ApiBearerAuth('JWT-auth') // ✅ DOCUMENTAR QUE REQUIERE JWT
@ApiResponse({ 
  status: 403, 
  description: 'Acceso denegado - Solo el rol vinculador puede usar este endpoint',
  schema: {
    example: {
      statusCode: 403,
      message: 'No tienes permiso para acceder a este recurso',
      error: 'Forbidden'
    }
  }
})
@ApiResponse({ 
  status: 401, 
  description: 'No autorizado - Token JWT requerido',
  schema: {
    example: {
      statusCode: 401,
      message: 'No autorizado',
      error: 'Unauthorized'
    }
  }
})
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      cuentaId: { type: 'string', example: '665a1b...' },
      monto: { type: 'string', example: '25.00' },
      sensorIds: {
        type: 'array',
        items: { type: 'string', example: '41' }
      }
    },
    required: ['cuentaId', 'monto', 'sensorIds']
  }
})
@ApiResponse({
  status: 200,
  description: 'Resultado de la validación',
  schema: {
    type: 'object',
    properties: {
      valid: { type: 'boolean', example: true },
      message: { type: 'string' }
    }
  }
})
async validarCompra(
  @Body() body: {
    cuentaId: string;
    monto: string;
    sensorIds: string[];
  },
  @Request() req: any // Para acceder a información del usuario si es necesario
) {
  // Validación adicional del rol a nivel de método (doble seguridad)
  if (req.user?.id_rol !== '681144a24ea765b9fe824070') {
    throw new ForbiddenException('Solo el rol vinculador puede validar compras');
  }

  return this.patternService.validarCompraConPatron(body);
}
}