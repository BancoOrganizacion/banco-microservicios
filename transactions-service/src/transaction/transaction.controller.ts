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
  // 1. TRANSFERENCIAS - CORREGIDO ✅
  // ============================================

  @ApiOperation({ summary: 'Realizar transferencia entre cuentas' })
  @ApiBody({ type: TransferirDto })
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
  @ApiBadRequestResponse({ description: 'Datos inválidos o saldo insuficiente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post('transferir')
  async transferir(@Body() transferirDto: TransferirDto, @Request() req) {
    try {
      const usuarioId = req.user?.id_usuario;
      
      this.logger.debug(`Usuario ${usuarioId} iniciando transferencia`);
      
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
          fecha_creacion: transaccion.createdAt // ✅ AHORA FUNCIONA
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
  @ApiOkResponse({ description: 'Historial de transferencias obtenido' })
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
  @ApiOkResponse({ description: 'Detalles de la transferencia' })
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
  // 2. DEPÓSITOS Y RETIROS
  // ============================================

  @ApiOperation({ summary: 'Realizar depósito en cuenta' })
  @ApiBody({ type: DepositarDto })
  @ApiCreatedResponse({
    description: 'Depósito procesado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Depósito procesado exitosamente' },
        transaccion: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            numero_transaccion: { type: 'string' },
            tipo: { type: 'string', example: 'DEPOSITO' },
            monto: { type: 'number' },
            estado: { type: 'string', example: 'COMPLETADA' },
            fecha_procesamiento: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post('depositar')
  async depositar(@Body() depositarDto: DepositarDto, @Request() req) {
    try {
      const usuarioId = req.user?.id_usuario;
      
      this.logger.debug(`Usuario ${usuarioId} realizando depósito`);
      
      const transaccion = await this.transactionService.depositar(depositarDto, usuarioId);
      
      return {
        success: true,
        message: 'Depósito procesado exitosamente',
        transaccion: {
          _id: transaccion._id,
          numero_transaccion: transaccion.numero_transaccion,
          tipo: transaccion.tipo,
          monto: transaccion.monto,
          estado: transaccion.estado,
          fecha_procesamiento: transaccion.fecha_procesamiento
        }
      };
    } catch (error) {
      this.logger.error(`Error en depósito: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Realizar retiro de cuenta' })
  @ApiBody({ type: RetirarDto })
  @ApiCreatedResponse({
    description: 'Retiro procesado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string' },
        transaccion: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            numero_transaccion: { type: 'string' },
            tipo: { type: 'string', example: 'RETIRO' },
            monto: { type: 'number' },
            estado: { type: 'string' },
            requiere_autenticacion: { type: 'boolean' },
            comision: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos o saldo insuficiente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post('retirar')
  async retirar(@Body() retirarDto: RetirarDto, @Request() req) {
    try {
      const usuarioId = req.user?.id_usuario;
      
      this.logger.debug(`Usuario ${usuarioId} realizando retiro`);
      
      const transaccion = await this.transactionService.retirar(retirarDto, usuarioId);
      
      return {
        success: true,
        message: transaccion.requiere_autenticacion 
          ? 'Retiro creado. Requiere autorización biométrica'
          : 'Retiro procesado exitosamente',
        transaccion: {
          _id: transaccion._id,
          numero_transaccion: transaccion.numero_transaccion,
          tipo: transaccion.tipo,
          monto: transaccion.monto,
          estado: transaccion.estado,
          requiere_autenticacion: transaccion.requiere_autenticacion,
          comision: transaccion.comision
        }
      };
    } catch (error) {
      this.logger.error(`Error en retiro: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Historial de retiros' })
  @ApiQuery({ name: 'fecha_inicio', required: false })
  @ApiQuery({ name: 'fecha_fin', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ description: 'Historial de retiros obtenido' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('retiros')
  async obtenerRetiros(@Query() query: QueryTransaccionesDto, @Request() req) {
    const usuarioId = req.user?.id_usuario;
    
    return this.transactionService.obtenerRetiros(usuarioId, query);
  }

  // ============================================
  // 3. CONSULTAS Y SALDOS - CORREGIDO ✅
  // ============================================

  @ApiOperation({ summary: 'Obtener movimientos de una cuenta' })
  @ApiParam({ name: 'cuentaId', description: 'ID de la cuenta' })
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
    // TODO: Validar que el usuario tenga acceso a esta cuenta
    
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
        fecha: mov.createdAt, // ✅ AHORA FUNCIONA
        comision: mov.comision
      }))
    };
  }

  @ApiOperation({ summary: 'Consultar saldo actual de una cuenta' })
  @ApiParam({ name: 'cuentaId', description: 'ID de la cuenta' })
  @ApiOkResponse({
    description: 'Información del saldo',
    schema: {
      type: 'object',
      properties: {
        cuenta_id: { type: 'string' },
        numero_cuenta: { type: 'string' },
        saldo_actual: { type: 'number' },
        fecha_ultimo_movimiento: { type: 'string', format: 'date-time' },
        ultimos_movimientos: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              numero_transaccion: { type: 'string' },
              tipo: { type: 'string' },
              monto: { type: 'number' },
              fecha: { type: 'string', format: 'date-time' }
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
  @Get('saldo/:cuentaId')
  async consultarSaldo(@Param('cuentaId') cuentaId: string, @Request() req) {
    // TODO: Validar que el usuario tenga acceso a esta cuenta
    
    this.logger.debug(`Consultando saldo de cuenta ${cuentaId}`);
    
    return this.transactionService.consultarSaldo(cuentaId);
  }

  // ============================================
  // 4. VALIDACIÓN Y AUTORIZACIÓN
  // ============================================

  @ApiOperation({ summary: 'Validar si una transacción es posible' })
  @ApiBody({ type: ValidarTransaccionDto })
  @ApiOkResponse({
    description: 'Resultado de la validación',
    schema: {
      type: 'object',
      properties: {
        es_valida: { type: 'boolean' },
        validaciones: {
          type: 'object',
          properties: {
            saldo_suficiente: { type: 'boolean' },
            cuenta_activa: { type: 'boolean' },
            monto_valido: { type: 'boolean' },
            comision_calculada: { type: 'number' },
            monto_total: { type: 'number' }
          }
        },
        restricciones: {
          type: 'object',
          properties: {
            requiere_autenticacion: { type: 'boolean' },
            patron_requerido: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
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
      
      // TODO: Aquí iría la validación biométrica con patterns service
      // const validacionBiometrica = await this.patternsService.validarPatron(
      //   autorizarDto.patron_autenticacion_id
      // );
      
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

  @ApiOperation({ summary: 'Verificar restricciones para un monto en una cuenta' })
  @ApiParam({ name: 'cuentaId', description: 'ID de la cuenta' })
  @ApiParam({ name: 'monto', description: 'Monto a verificar' })
  @ApiOkResponse({
    description: 'Información sobre restricciones aplicables',
    schema: {
      type: 'object',
      properties: {
        cuenta_id: { type: 'string' },
        monto_consultado: { type: 'number' },
        requiere_autenticacion: { type: 'boolean' },
        restriccion_aplicable: {
          type: 'object',
          nullable: true,
          properties: {
            monto_desde: { type: 'number' },
            monto_hasta: { type: 'number' },
            patron_autenticacion: { type: 'string', nullable: true }
          }
        },
        patron_requerido: { type: 'string', nullable: true }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('restricciones/:cuentaId/:monto')
  async verificarRestricciones(
    @Param('cuentaId') cuentaId: string,
    @Param('monto') monto: string
  ) {
    const montoNumerico = parseFloat(monto);
    
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      throw new BadRequestException('El monto debe ser un número válido mayor a 0');
    }
    
    this.logger.debug(`Verificando restricciones para cuenta ${cuentaId}, monto ${montoNumerico}`);
    
    const restricciones = await this.transactionService.verificarRestricciones(cuentaId, montoNumerico);
    
    return {
      cuenta_id: cuentaId,
      monto_consultado: montoNumerico,
      ...restricciones
    };
  }
}