import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CuentasService } from './cuentas.service';
import { CreateCuentaDto } from 'shared-models';
import { UpdateCuentaDto } from 'shared-models';
import { CreateRestriccionDto } from 'shared-models';
import { JwtDataGuard } from './guards/jwt-data.guard';

import { RoleGuard } from './guards/role.guard';
import { Roles } from './common/decorators/roles.decorators';

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
  ApiForbiddenResponse
} from '@nestjs/swagger';
import { ObjectId } from 'mongoose';

@ApiTags('cuentas')
@Controller('cuentas')
export class CuentasController {
  private readonly logger = new Logger(CuentasController.name);

  constructor(private readonly cuentasService: CuentasService) { }

  // Endpoint para crear una nueva cuenta
  @ApiOperation({ summary: 'Crear una nueva cuenta bancaria' })
  @ApiBody({ type: CreateCuentaDto })
  @ApiCreatedResponse({ description: 'Cuenta creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o el usuario ya tiene 2 cuentas' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Post()
  async create(@Body() createCuentaDto: CreateCuentaDto, @Request() req) {
    try {
      this.logger.debug(`Creando cuenta para usuario: ${createCuentaDto.titular}`);

      // Si no se proporciona titular, usar el ID del usuario autenticado
      if (!createCuentaDto.titular) {
        createCuentaDto.titular = req.user.id_usuario;
      }
      // Si no es admin, solo puede crear cuentas para sí mismo
      else if (req.user.id_rol !== 'ID_ROL_ADMIN' && createCuentaDto.titular !== req.user.id_usuario) {
        throw new BadRequestException('No tienes permiso para crear cuentas para otros usuarios');
      }

      const cuenta = await this.cuentasService.create(createCuentaDto);
      return {
        success: true,
        message: 'Cuenta creada exitosamente',
        cuenta: {
          id: cuenta._id,
          numero_cuenta: cuenta.numero_cuenta,
          tipo_cuenta: cuenta.tipo_cuenta,
          estado: cuenta.estado,
          titular: cuenta.titular
        }
      };
    } catch (error) {
      this.logger.error(`Error al crear cuenta: ${error.message}`);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al crear la cuenta bancaria');
    }
  }

  // Endpoint para obtener todas las cuentas (solo admin)
  @ApiOperation({ summary: 'Obtener todas las cuentas (solo admin)' })
  @ApiOkResponse({ description: 'Lista de cuentas' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso denegado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard, RoleGuard)
  @Roles('ID_ROL_ADMIN')
  @Get()
  async findAll() {
    this.logger.debug('Obteniendo todas las cuentas');
    return this.cuentasService.findAll();
  }

  // Endpoint para obtener las cuentas del usuario autenticado
  @ApiOperation({ summary: 'Obtener mis cuentas' })
  @ApiOkResponse({ description: 'Lista de cuentas del usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('mis-cuentas')
  async findMyCuentas(@Request() req) {
    const userId = req.user.id_usuario;
    this.logger.debug(`Obteniendo cuentas del usuario: ${userId}`);
    return this.cuentasService.findByUsuario(userId);
  }

  // Endpoint para obtener cuentas de un usuario específico (admin)
  @ApiOperation({ summary: 'Obtener cuentas de un usuario específico (solo admin)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiOkResponse({ description: 'Lista de cuentas del usuario' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso denegado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard, RoleGuard)
  @Roles('ID_ROL_ADMIN')
  @Get('usuario/:userId')
  async findCuentasByUsuario(@Param('userId') userId: string) {
    this.logger.debug(`Obteniendo cuentas del usuario: ${userId}`);
    return this.cuentasService.findByUsuario(userId);
  }

 
  // Endpoint para eliminar una restricción
  @ApiOperation({ summary: 'Eliminar una restricción de una cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiParam({ name: 'restriccionId', description: 'ID de la restricción' })
  @ApiOkResponse({ description: 'Restricción eliminada' })
  @ApiNotFoundResponse({ description: 'Cuenta o restricción no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Delete(':id/restricciones/:restriccionId')
  async removeRestriccion(
    @Param('id') id: string,
    @Param('restriccionId') restriccionId: string,
    @Request() req
  ) {
    this.logger.debug(`Eliminando restricción ${restriccionId} de cuenta: ${id}`);
    const cuenta = await this.cuentasService.findOne(id);

    // Verificar que el usuario tenga acceso a esta cuenta
    if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
      cuenta.titular.toString() !== req.user.id_usuario) {
      throw new BadRequestException('No tienes permiso para modificar esta cuenta');
    }

    return this.cuentasService.removeRestriccion(id, restriccionId);
  }

  // Endpoint para validar una operación
  @ApiOperation({ summary: 'Validar si una operación requiere patrón de autenticación' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        monto: {
          type: 'number',
          example: 5000
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Resultado de la validación',
    schema: {
      type: 'object',
      properties: {
        requierePatron: {
          type: 'boolean',
          example: true
        },
        patronId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011'
        }
      }
    }
  })



  // Endpoint para obtener movimientos de una cuenta
  @ApiOperation({ summary: 'Obtener movimientos de una cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiOkResponse({ description: 'Lista de movimientos' })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get(':id/movimientos')
  async getMovimientos(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Obteniendo movimientos de cuenta: ${id}`);
    const cuenta = await this.cuentasService.findOne(id);

    // Verificar que el usuario tenga acceso a esta cuenta
    if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
      cuenta.titular.toString() !== req.user.id_usuario) {
      throw new BadRequestException('No tienes permiso para ver los movimientos de esta cuenta');
    }

    return this.cuentasService.getMovimientos(id);
  }

  // Endpoint para microservicios - Procesar movimiento
  @MessagePattern('accounts.procesarMovimiento')
  async procesarMovimiento(data: { cuentaId: string, monto: number, movimientoId: ObjectId }) {
    this.logger.debug(`Procesando movimiento ${data.movimientoId} para cuenta ${data.cuentaId}`);
    await this.cuentasService.procesarMovimiento(data);
    return { success: true };
  }


  // Endpoint para microservicios - Actualizar saldo
  @MessagePattern('accounts.actualizarSaldo')
  async actualizarSaldo(data: { cuentaId: string, monto: number }) {
    this.logger.debug(`Actualizando saldo de cuenta ${data.cuentaId} en ${data.monto}`);
    const cuenta = await this.cuentasService.actualizarSaldo(data.cuentaId, data.monto);
    return {
      id: cuenta._id,
      numero_cuenta: cuenta.numero_cuenta,
      monto_actual: cuenta.monto_actual
    };
  }

  // Endpoint para microservicios - Buscar cuenta por número
  @MessagePattern('accounts.findByNumeroCuenta')
  async findByNumeroCuentaMS(numeroCuenta: string) {
    this.logger.debug(`Microservicio: Buscando cuenta con número: ${numeroCuenta}`);
    return this.cuentasService.findByNumeroCuenta(numeroCuenta);
  }


  // Endpoint para obtener cuenta por número
  @ApiOperation({ summary: 'Obtener cuenta por número' })
  @ApiParam({ name: 'numeroCuenta', description: 'Número de cuenta (10 dígitos)' })
  @ApiOkResponse({ description: 'Cuenta encontrada' })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Get('numero/:numeroCuenta')
  async findByNumeroCuenta(@Param('numeroCuenta') numeroCuenta: string, @Request() req) {
    this.logger.debug(`Buscando cuenta con número: ${numeroCuenta}`);
    const cuenta = await this.cuentasService.findByNumeroCuenta(numeroCuenta);

    // Verificar que el usuario tenga acceso a esta cuenta
    if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
      cuenta.titular.toString() !== req.user.id_usuario) {
      throw new BadRequestException('No tienes permiso para ver esta cuenta');
    }

    return cuenta;
  }

  // Endpoint para actualizar una cuenta
  @ApiOperation({ summary: 'Actualizar estado o tipo de una cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiBody({ type: UpdateCuentaDto })
  @ApiOkResponse({ description: 'Cuenta actualizada' })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso denegado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard, RoleGuard)
  @Roles('ID_ROL_ADMIN')
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCuentaDto: UpdateCuentaDto) {
    this.logger.debug(`Actualizando cuenta con ID: ${id}`);
    return this.cuentasService.update(id, updateCuentaDto);
  }

  // Endpoint para cancelar una cuenta
  @ApiOperation({ summary: 'Cancelar una cuenta' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta' })
  @ApiOkResponse({ description: 'Cuenta cancelada' })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiBadRequestResponse({ description: 'No se puede cancelar una cuenta con saldo positivo' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtDataGuard)
  @Delete(':id')
  async cancelar(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Cancelando cuenta con ID: ${id}`);
    const cuenta = await this.cuentasService.findOne(id);

    // Verificar que el usuario tenga acceso a esta cuenta
    if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
      cuenta.titular.toString() !== req.user.id_usuario) {
      throw new BadRequestException('No tienes permiso para cancelar esta cuenta');
    }

    return this.cuentasService.cancelarCuenta(id);
  }

}



/*
// Endpoint para añadir una restricción
@ApiOperation({ summary: 'Añadir una restricción a una cuenta' })
@ApiParam({ name: 'id', description: 'ID de la cuenta' })
@ApiBody({ type: CreateRestriccionDto })
@ApiOkResponse({ description: 'Restricción añadida' })
@ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
@ApiBadRequestResponse({ description: 'Datos inválidos o rangos solapados' })
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtDataGuard)
@Post(':id/restricciones')
async addRestriccion(
  @Param('id') id: string, 
  @Body() restriccion: CreateRestriccionDto,
  @Request() req
) {
  this.logger.debug(`Añadiendo restricción a cuenta: ${id}`);
  const cuenta = await this.cuentasService.findOne(id);
  
  // Verificar que el usuario tenga acceso a esta cuenta
*/