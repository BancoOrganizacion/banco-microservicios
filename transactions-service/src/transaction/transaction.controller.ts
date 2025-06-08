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
  

  // ============================================
  // 4. VALIDACIÓN Y AUTORIZACIÓN
  // ============================================

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


}