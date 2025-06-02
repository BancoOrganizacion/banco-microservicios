import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransferirDto } from './dto/transferencia.dto';
import { DepositarDto } from './dto/deposito.dto';
import { RetirarDto } from './dto/retiro.dto';
import { ValidarTransaccionDto } from './dto/validar-transaccion.dto';
import { AutorizarTransaccionDto } from './dto/autorizar-transaccion.dto';
import { QueryTransaccionesDto } from './dto/query-transacciones.dto';
import { JwtDataGuard } from '../transaction/middleware/jwt-data.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiQuery
} from '@nestjs/swagger';

@ApiTags('transacciones')
@Controller('transacciones')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  // ============================================
  // 1. TRANSFERENCIAS
  // ============================================

  @ApiOperation({ summary: 'Realizar transferencia entre cuentas usando números de cuenta' })
  @ApiBody({ 
    type: TransferirDto,
    description: 'Datos para la transferencia usando números de cuenta de 10 dígitos',
    examples: {
      transferencia_ejemplo: {
        summary: 'Ejemplo de transferencia',
        value: {
          numero_cuenta_origen: '1234567890',
          numero_cuenta_destino: '0987654321',
          monto: 100.50,
          descripcion: 'Pago de servicios'
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Transferencia creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Transferencia procesada exitosamente' },
        transaccion: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            numero_transaccion: { type: 'string' },
            tipo: { type: 'string', example: 'TRANSFERENCIA' },
            monto: { type: 'number' },
            estado: { type: 'string', example: 'PENDIENTE' },
            requiere_autenticacion: { type: 'boolean' },
            comision: { type: 'number' },
            fecha_creacion: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Datos inválidos o saldo insuficiente',
    schema: {
      example: {
        statusCode: 400,
        message: 'Saldo insuficiente para realizar la transferencia',
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post('transferir')
  async transferir(@Body() transferirDto: TransferirDto, @Request() req) {
    try {
      const usuarioId = req.user?.id_usuario;
      
      this.logger.debug(`Usuario ${usuarioId} iniciando transferencia desde ${transferirDto.numero_cuenta_origen} hacia ${transferirDto.numero_cuenta_destino}`);
      
      const transaccion = await this.transactionService.transferir(transferirDto, usuarioId);
      
      return {
        success: true,
        message: transaccion.requiere_autenticacion 
          ? 'Transferencia creada. Requiere autorización biométrica'
          : 'Transferencia procesada exitosamente',
        transaccion: {
          _id: transaccion._id,
          numero_transaccion: transaccion.numero_transaccion,
          tipo: transaccion.tipo,
          monto: transaccion.monto,
          estado: transaccion.estado,
          requiere_autenticacion: transaccion.requiere_autenticacion,
          comision: transaccion.comision,
          fecha_creacion: transaccion.createdAt
        }
      };
    } catch (error) {
      this.logger.error(`Error en transferencia: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Consultar historial de transferencias' })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'estado', required: false, enum: ['PENDIENTE', 'COMPLETADA', 'FALLIDA', 'CANCELADA'] })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite por página' })
  @ApiOkResponse({ 
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
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('transferencias')
  async obtenerTransferencias(@Query() query: QueryTransaccionesDto, @Request() req) {
    const usuarioId = req.user?.id_usuario;
    
    this.logger.debug(`Obteniendo transferencias para usuario ${usuarioId}`);
    
    return this.transactionService.obtenerTransferencias(usuarioId, query);
  }

  @ApiOperation({ summary: 'Obtener detalles de una transferencia específica' })
  @ApiParam({ name: 'id', description: 'ID de la transferencia' })
  @ApiOkResponse({ 
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
        comision: 0.10,
        fecha_creacion: '2025-06-01T10:30:00.000Z'
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Transferencia no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('transferencias/:id')
  async obtenerTransferenciaPorId(@Param('id') id: string, @Request() req) {
    const usuarioId = req.user?.id_usuario;
    
    return this.transactionService.obtenerTransferenciaPorId(id, usuarioId);
  }

  
  // ============================================
  // 2. CONSULTAS Y SALDOS
  // ============================================

  @ApiOperation({ summary: 'Obtener movimientos de una cuenta por ID' })
  @ApiParam({ name: 'cuentaId', description: 'ID interno de la cuenta' })
  @ApiOkResponse({
    description: 'Movimientos de la cuenta',
    schema: {
      type: 'object',
      properties: {
        cuenta_id: { type: 'string' },
        total_movimientos: { type: 'number' },
        movimientos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              numero_transaccion: { type: 'string' },
              tipo: { type: 'string' },
              monto: { type: 'number' },
              descripcion: { type: 'string' },
              estado: { type: 'string' },
              fecha: { type: 'string', format: 'date-time' },
              comision: { type: 'number' }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('movimientos/:cuentaId')
  async obtenerMovimientos(@Param('cuentaId') cuentaId: string, @Request() req) {
    this.logger.debug(`Obteniendo movimientos de cuenta ${cuentaId}`);
    
    const movimientos = await this.transactionService.obtenerMovimientosCuenta(cuentaId);
    
    return {
      cuenta_id: cuentaId,
      total_movimientos: movimientos.length,
      movimientos: movimientos.map(mov => ({
        _id: mov._id,
        numero_transaccion: mov.numero_transaccion,
        tipo: mov.tipo,
        monto: mov.monto,
        descripcion: mov.descripcion,
        estado: mov.estado,
        fecha: mov.createdAt,
        comision: mov.comision
      }))
    };
  }

  @ApiOperation({ summary: 'Consultar saldo actual de una cuenta por ID' })
  @ApiParam({ name: 'cuentaId', description: 'ID interno de la cuenta' })
  @ApiOkResponse({
    description: 'Información del saldo',
    schema: {
      example: {
        cuenta_id: '507f1f77bcf86cd799439011',
        numero_cuenta: '1234567890',
        saldo_actual: 1500.75,
        fecha_ultimo_movimiento: '2025-06-01T10:30:00.000Z',
        ultimos_movimientos: [
          {
            _id: '507f1f77bcf86cd799439020',
            numero_transaccion: 'TXN-1234567890-1234',
            tipo: 'TRANSFERENCIA',
            monto: 100.50,
            fecha: '2025-06-01T10:30:00.000Z'
          }
        ]
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('saldo/:cuentaId')
  async consultarSaldo(@Param('cuentaId') cuentaId: string, @Request() req) {
    this.logger.debug(`Consultando saldo de cuenta ${cuentaId}`);
    
    return this.transactionService.consultarSaldo(cuentaId);
  }

  // ============================================
  // 4. VALIDACIÓN Y AUTORIZACIÓN
  // ============================================

  @ApiOperation({ summary: 'Validar si una transacción es posible usando números de cuenta' })
  @ApiBody({ 
    type: ValidarTransaccionDto,
    examples: {
      validacion_transferencia: {
        summary: 'Validar transferencia',
        value: {
          numero_cuenta_origen: '1234567890',
          numero_cuenta_destino: '0987654321',
          monto: 1500.00,
          tipo: 'TRANSFERENCIA'
        }
      },
      validacion_retiro: {
        summary: 'Validar retiro',
        value: {
          numero_cuenta_origen: '1234567890',
          monto: 200.00,
          tipo: 'RETIRO'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Resultado de la validación',
    schema: {
      example: {
        es_valida: true,
        validaciones: {
          saldo_suficiente: true,
          cuenta_activa: true,
          monto_valido: true,
          comision_calculada: 1.50,
          monto_total: 1501.50
        },
        restricciones: {
          requiere_autenticacion: true,
          patron_requerido: '507f1f77bcf86cd799439030'
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos o cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post('validar')
  async validarTransaccion(@Body() validarDto: ValidarTransaccionDto) {
    this.logger.debug(`Validando transacción: ${JSON.stringify(validarDto)}`);
    
    return this.transactionService.validarTransaccion(validarDto);
  }

  @ApiOperation({ summary: 'Autorizar transacción con autenticación biométrica' })
  @ApiBody({ type: AutorizarTransaccionDto })
  @ApiOkResponse({
    description: 'Transacción autorizada y procesada',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Transacción autorizada y procesada exitosamente' },
        transaccion: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            numero_transaccion: { type: 'string' },
            estado: { type: 'string', example: 'COMPLETADA' },
            fecha_autorizacion: { type: 'string', format: 'date-time' },
            fecha_procesamiento: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Código inválido o transacción no válida' })
  @ApiNotFoundResponse({ description: 'Transacción no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post('autorizar')
  async autorizarTransaccion(@Body() autorizarDto: AutorizarTransaccionDto) {
    try {
      this.logger.debug(`Autorizando transacción ${autorizarDto.transaccion_id}`);
      
      const transaccion = await this.transactionService.autorizarTransaccion(autorizarDto);
      
      return {
        success: true,
        message: 'Transacción autorizada y procesada exitosamente',
        transaccion: {
          _id: transaccion._id,
          numero_transaccion: transaccion.numero_transaccion,
          estado: transaccion.estado,
          fecha_autorizacion: transaccion.fecha_autorizacion,
          fecha_procesamiento: transaccion.fecha_procesamiento
        }
      };
    } catch (error) {
      this.logger.error(`Error autorizando transacción: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Verificar restricciones para un monto usando número de cuenta' })
  @ApiParam({ name: 'numeroCuenta', description: 'Número de cuenta (10 dígitos)' })
  @ApiParam({ name: 'monto', description: 'Monto a verificar' })
  @ApiOkResponse({
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
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('restricciones/:numeroCuenta/:monto')
  async verificarRestricciones(
    @Param('numeroCuenta') numeroCuenta: string,
    @Param('monto') monto: string
  ) {
    const montoNumerico = parseFloat(monto);
    
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      throw new BadRequestException('El monto debe ser un número válido mayor a 0');
    }
    
    if (!/^\d{10}$/.test(numeroCuenta)) {
      throw new BadRequestException('El número de cuenta debe tener exactamente 10 dígitos');
    }
    
    this.logger.debug(`Verificando restricciones para cuenta ${numeroCuenta}, monto ${montoNumerico}`);
    
    // Primero obtenemos la cuenta por número para obtener su ID
    const cuenta = await this.transactionService['obtenerCuentaPorNumero'](numeroCuenta);
    const restricciones = await this.transactionService.verificarRestricciones(cuenta._id.toString(), montoNumerico);
    
    return {
      numero_cuenta: numeroCuenta,
      monto_consultado: montoNumerico,
      ...restricciones
    };
  }
}