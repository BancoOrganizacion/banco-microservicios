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
  Query,
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
  ApiForbiddenResponse,
  ApiQuery
} from '@nestjs/swagger';
import { ObjectId } from 'mongoose';
import { UpdateRestriccionDto } from './dto/update-restriccion.dto';

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
    if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
      cuenta.titular.toString() !== req.user.id_usuario) {
      throw new BadRequestException('No tienes permiso para modificar esta cuenta');
    }

    return this.cuentasService.addRestriccion(id, restriccion);
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

  // Endpoint para obtener movimientos de una cuenta
 // Endpoint para obtener movimientos de las cuentas del usuario
@ApiOperation({ summary: 'Obtener movimientos de una cuenta específica del usuario' })
@ApiOkResponse({ description: 'Lista de movimientos de la cuenta' })
@ApiNotFoundResponse({ description: 'Usuario no encontrado, cuenta no encontrada o cuenta no pertenece al usuario' })
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@ApiBearerAuth('JWT-auth')
@ApiQuery({ 
  name: 'id_cuenta', 
  description: 'ID de la cuenta de la cual obtener los movimientos',
  required: true,
  type: 'string'
})
@UseGuards(JwtDataGuard)
@Get('movimientos')
async getMovimientos(
  @Request() req,
  @Query('id_cuenta') idCuenta: string
) {
  const userId = req.user.id_usuario;
  this.logger.debug(`Obteniendo movimientos para usuario: ${userId}, cuenta: ${idCuenta}`);

  // Validar que el id_cuenta fue proporcionado
  if (!idCuenta) {
    throw new BadRequestException('El parámetro id_cuenta es requerido');
  }

  // Los admins pueden ver movimientos de cualquier cuenta
  // Los usuarios solo pueden ver movimientos de sus propias cuentas
  if (req.user.id_rol === 'ID_ROL_ADMIN') {
    return this.cuentasService.getMovimientos(userId, idCuenta);
  } else {
    // Para usuarios normales, verificar que la cuenta les pertenece
    return this.cuentasService.getMovimientos(userId, idCuenta);
  }
}

  // PARA MICROSERVICIOS 
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

  // Endpoint para obtener todas las restricciones de una cuenta
@ApiOperation({ summary: 'Obtener restricciones de una cuenta' })
@ApiParam({ name: 'id', description: 'ID de la cuenta' })
@ApiOkResponse({ description: 'Lista de restricciones de la cuenta' })
@ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtDataGuard)
@Get(':id/restricciones')
async getRestricciones(@Param('id') id: string, @Request() req) {
  const cuenta = await this.cuentasService.findOne(id);

  // Verificar que el usuario tenga acceso a esta cuenta
  if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
    cuenta.titular.toString() !== req.user.id_usuario) {
    throw new BadRequestException('No tienes permiso para ver las restricciones de esta cuenta');
  }

  return this.cuentasService.getRestricciones(id);
}

// Endpoint para actualizar una restricción
@ApiOperation({ summary: 'Actualizar una restricción de una cuenta' })
@ApiParam({ name: 'id', description: 'ID de la cuenta' })
@ApiParam({ name: 'restriccionId', description: 'ID de la restricción' })
@ApiBody({ type: UpdateRestriccionDto })
@ApiOkResponse({ description: 'Restricción actualizada' })
@ApiNotFoundResponse({ description: 'Cuenta o restricción no encontrada' })
@ApiBadRequestResponse({ description: 'Datos inválidos o rangos solapados' })
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtDataGuard)
@Put(':id/restricciones/:restriccionId')
async updateRestriccion(
  @Param('id') id: string,
  @Param('restriccionId') restriccionId: string,
  @Body() updateRestriccionDto: UpdateRestriccionDto,
  @Request() req
) {
  const cuenta = await this.cuentasService.findOne(id);

  // Verificar que el usuario tenga acceso a esta cuenta
  if (req.user.id_rol !== 'ID_ROL_ADMIN' &&
    cuenta.titular.toString() !== req.user.id_usuario) {
    throw new BadRequestException('No tienes permiso para modificar las restricciones de esta cuenta');
  }

  return this.cuentasService.updateRestriccion(id, restriccionId, updateRestriccionDto);
}

// ENDPOINTS PARA MICROSERVICIOS DE TRANSACCIONES

  
  // Endpoint para microservicios - Buscar cuenta por ID
  @MessagePattern('accounts.findById')
  async findByIdMS(cuentaId: string) {
    this.logger.debug(`Microservicio: Buscando cuenta con ID: ${cuentaId}`);
    return this.cuentasService.findOne(cuentaId);
  }

  // Endpoint para microservicios - Obtener restricciones
  @MessagePattern('accounts.getRestricciones')
  async getRestriccionesMS(cuentaId: string) {
    this.logger.debug(`Microservicio: Obteniendo restricciones de cuenta: ${cuentaId}`);
    return this.cuentasService.getRestricciones(cuentaId);
  }
  // accounts-service/src/cuentas/cuentas.controller.ts
// AGREGAR ESTE ENDPOINT AL CONTROLADOR:

@ApiOperation({ summary: 'Validar transacción con patrones biométricos' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      cuentaId: {
        type: 'string',
        description: 'ID de la cuenta transaccional',
        example: '686066c93ad1bb1d136aa2d8'
      },
      monto: {
        type: 'string',
        description: 'Monto de la transacción',
        example: '25.00'
      },
      sensorIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'IDs de los sensores de huellas',
        example: ['6', '8', '10']
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
      message: { type: 'string', example: 'Patrón válido. Transacción autorizada.' },
      requiere_autenticacion: { type: 'boolean', example: true },
      coincidencias: { type: 'number', example: 3 },
      requeridas: { type: 'number', example: 3 }
    }
  }
})
@ApiResponse({ status: 400, description: 'Datos inválidos' })
@ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
@Post('validar-transaccion-biometrica')
async validarTransaccionBiometrica(@Body() body: {
  cuentaId: string;
  monto: string;
  sensorIds: string[];
}) {
  try {
    this.logger.debug(`Validando transacción biométrica para cuenta: ${body.cuentaId}`);
    
    // Validar parámetros
    if (!body.cuentaId || !body.monto || !Array.isArray(body.sensorIds)) {
      throw new BadRequestException('Parámetros inválidos. Se requiere cuentaId, monto y sensorIds.');
    }

    if (body.sensorIds.length === 0) {
      throw new BadRequestException('Se requiere al menos un sensorId.');
    }

    const resultado = await this.cuentasService.validarTransaccionConPatrones(body);
    
    this.logger.debug(`Resultado de validación: ${JSON.stringify(resultado)}`);
    
    return resultado;
  } catch (error) {
    this.logger.error(`Error en validación biométrica: ${error.message}`);
    
    if (error instanceof BadRequestException) {
      throw error;
    }
    
    throw new BadRequestException('Error al validar la transacción biométrica');
  }
}
}