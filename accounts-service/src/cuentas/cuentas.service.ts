import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Cuenta, EstadoCuenta, Restriccion } from 'shared-models';
import { CreateCuentaDto } from 'shared-models';
import { CreateRestriccionDto } from 'shared-models';
import { UpdateCuentaDto } from 'shared-models';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UpdateRestriccionDto } from './dto/update-restriccion.dto';
import {Transaccion,TransaccionSchema} from 'shared-models'

@Injectable()
export class CuentasService {
  private readonly logger = new Logger(CuentasService.name);

  constructor(
    @InjectModel(Cuenta.name) private cuentaModel: Model<Cuenta>,
    @InjectModel(Transaccion.name) private trxModel: Model<Transaccion>,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}

  /**
   * Genera un número de cuenta único de 10 dígitos
   */
  private async generarNumeroCuenta(): Promise<string> {
    let numeroCuenta;
    let cuentaExistente;
    
    do {
      // Generar número aleatorio de 10 dígitos
      numeroCuenta = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      // Verificar si ya existe
      cuentaExistente = await this.cuentaModel.findOne({ numero_cuenta: numeroCuenta }).exec();
    } while (cuentaExistente);
    
    return numeroCuenta;
  }

  /**
   * Crea una nueva cuenta para un usuario
   */
  async create(createCuentaDto: CreateCuentaDto): Promise<Cuenta> {
    try {
      // Verificar si el usuario existe
      const usuario = await firstValueFrom(
        this.usersClient.send('users.findOne', createCuentaDto.titular)
      );
      
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${createCuentaDto.titular} no encontrado`);
      }
  
      // Verificar si el usuario ya tiene 2 cuentas
      const cuentasUsuario = await this.cuentaModel.find({ 
        titular: createCuentaDto.titular,
        estado: { $ne: EstadoCuenta.CANCELADA }
      }).exec();
      
      if (cuentasUsuario.length >= 2) {
        throw new BadRequestException(`El usuario ya tiene el máximo de 2 cuentas permitidas`);
      }
  
      // Generar número de cuenta único
      const numeroCuenta = await this.generarNumeroCuenta();
  
      // Crear nueva cuenta
      const nuevaCuenta = new this.cuentaModel({
        ...createCuentaDto,
        numero_cuenta: numeroCuenta,
        monto_actual: 0,
        estado: EstadoCuenta.ACTIVA,
        restricciones: [],
        movimientos: []
      });
  
      // Guardar la cuenta
      const cuentaGuardada = await nuevaCuenta.save();
      
      // Agregar la cuenta al usuario en CuentaApp
      try {
        await firstValueFrom(
          this.usersClient.send('users.addCuentaToUser', {
            userId: createCuentaDto.titular,
            cuentaId: cuentaGuardada._id
          })
        );
      } catch (error) {
        this.logger.error(`Error al vincular cuenta con usuario: ${error.message}`);
        // Considera si debes eliminar la cuenta creada si falla este paso
      }
      
      return cuentaGuardada;
    } catch (error) {
      this.logger.error(`Error al crear cuenta: ${error.message}`);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al crear cuenta: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las cuentas
   */
  async findAll(): Promise<Cuenta[]> {
    return this.cuentaModel.find().exec();
  }

  /**
   * Obtiene las cuentas de un usuario específico
   */
  async findByUsuario(usuarioId: string): Promise<Cuenta[]> {
    return this.cuentaModel.find({ 
      titular: usuarioId,
      estado: { $ne: EstadoCuenta.CANCELADA }
    }).exec();
  }

  /**
   * Obtiene una cuenta específica por su ID
   */
  async findOne(id: string): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findById(id).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada`);
    }
    
    return cuenta;
  }

  /**
   * Obtiene una cuenta por su número
   */
  async findByNumeroCuenta(numeroCuenta: string): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findOne({ numero_cuenta: numeroCuenta }).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con número ${numeroCuenta} no encontrada`);
    }
    
    return cuenta;
  }

  /**
   * Actualiza el estado o tipo de una cuenta
   */
  async update(id: string, updateCuentaDto: UpdateCuentaDto): Promise<Cuenta> {
    const cuentaActualizada = await this.cuentaModel
      .findByIdAndUpdate(id, updateCuentaDto, { new: true })
      .exec();
    
    if (!cuentaActualizada) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada`);
    }
    
    return cuentaActualizada;
  }

  /**
   * Cambia el estado de una cuenta a CANCELADA
   */
  async cancelarCuenta(id: string): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findById(id).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada`);
    }
    
    if (cuenta.monto_actual > 0) {
      throw new BadRequestException(`No se puede cancelar una cuenta con saldo positivo`);
    }
    
    cuenta.estado = EstadoCuenta.CANCELADA;
    return cuenta.save();
  }

  /**
   * Añade una restricción a una cuenta
   */
  async addRestriccion(id: string, restriccion: CreateRestriccionDto): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findById(id).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada`);
    }
    
    // Validar que monto_desde sea menor que monto_hasta
    if (restriccion.monto_desde >= restriccion.monto_hasta) {
      throw new BadRequestException('El monto inicial debe ser menor que el monto final');
    }
    
    // Verificar solapamiento con otras restricciones (sin permitir valores límite compartidos)
    const solapamiento = cuenta.restricciones.some(r => 
    restriccion.monto_desde <= r.monto_hasta && restriccion.monto_hasta >= r.monto_desde
  );
    
    if (solapamiento) {
      throw new BadRequestException('Los rangos de monto se solapan con restricciones existentes');
    }
    
    // Crear explícitamente un objeto con la estructura exacta esperada por el esquema
    const nuevaRestriccion = {
      monto_desde: restriccion.monto_desde,
      monto_hasta: restriccion.monto_hasta
    };
    
    // Si hay un patron_autenticacion, añadirlo (solo si no es null/undefined)
    if (restriccion.patron_autenticacion) {
      nuevaRestriccion['patron_autenticacion'] = new Types.ObjectId(restriccion.patron_autenticacion);
    }

    console.log("Nueva restricción a guardar:", nuevaRestriccion);

    // Usar findByIdAndUpdate con $push, pero asegurándonos de dar el formato correcto
    const cuentaActualizada = await this.cuentaModel.findByIdAndUpdate(
      id,
      { $push: { restricciones: nuevaRestriccion } },
      { new: true }
    ).exec();
    
    console.log("Cuenta actualizada:", JSON.stringify(cuentaActualizada, null, 2));
    
    if (!cuentaActualizada) {
      throw new NotFoundException(`Cuenta con ID ${id} no encontrada`);
    }
    
    return cuentaActualizada;
  }

  /**
   * Elimina una restricción de una cuenta
   */
  async removeRestriccion(cuentaId: string, restriccionId: string): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findById(cuentaId).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
    
    // Filtrar restricciones para eliminar la indicada
    cuenta.restricciones = cuenta.restricciones.filter(
      r => r._id.toString() !== restriccionId
    );
    
    return cuenta.save();
  }

  /**
   * Obtener los movimientos de una cuenta
   * Este método se comunicará con el microservicio de movimientos cuando esté disponible
   */
  async getMovimientos(idUsuario: string, idCuenta: string): Promise<any[]> {
  // 1. Buscar la cuenta específica (sin verificar titular para admins)
  const cuenta = await this.cuentaModel.findOne({ _id: idCuenta }).exec();
  
  if (!cuenta) {
    throw new NotFoundException(`No se encontró la cuenta con ID ${idCuenta}`);
  }
  
  // 2. Buscar transacciones donde esta cuenta específica aparezca como origen o destino
  const transacciones = await this.trxModel.find({
    $or: [
      { cuenta_origen: cuenta._id },
      { cuenta_destino: cuenta._id }
    ]
  }).exec();
  
  // 3. Mapear las transacciones para devolver solo los datos relevantes
  const movimientos = transacciones.map(transaccion => ({
    numero_transaccion: transaccion.numero_transaccion,
    monto_total: transaccion.monto + (transaccion.comision || 0),
    descripcion: transaccion.descripcion,
    tipo: transaccion.cuenta_origen.toString() === cuenta._id.toString() ? 'SALIDA' : 'ENTRADA',
    cuenta_origen: transaccion.cuenta_origen,
    cuenta_destino: transaccion.cuenta_destino,
    fecha: transaccion.createdAt,
    // Info adicional para admins
    titular_cuenta: cuenta.titular
  }));
  
  return movimientos;
}

// OPCIONAL: Método para obtener todas las cuentas del usuario (útil para el frontend)
async getCuentasUsuario(idUsuario: string): Promise<any[]> {
  const cuentas = await this.cuentaModel.find({ titular: idUsuario }).exec();
  
  return cuentas.map(cuenta => ({
    id: cuenta._id,
    numero_cuenta: cuenta.numero_cuenta,
    tipo_cuenta: cuenta.tipo_cuenta,
    saldo: cuenta.monto_actual,
    estado: cuenta.estado
  }));
}

  /**
   * Actualiza el saldo de una cuenta (método interno)
   */
  async actualizarSaldo(cuentaId: string, monto: number): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findById(cuentaId).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
    
    // Actualizar el saldo
    cuenta.monto_actual += monto;
    cuenta.fecha_ultimo_movimiento = new Date();
    
    return cuenta.save();
  }

  /**
   * Método para webhook de movimientos
   */
  async procesarMovimiento(data: { 
    cuentaId: string, 
    monto: number, 
    movimientoId: ObjectId 
  }): Promise<void> {
    try {
      const cuenta = await this.cuentaModel.findById(data.cuentaId).exec();
      
      if (!cuenta) {
        throw new NotFoundException(`Cuenta con ID ${data.cuentaId} no encontrada`);
      }
      
      // Actualizar saldo
      cuenta.monto_actual += data.monto;
      cuenta.fecha_ultimo_movimiento = new Date();
      
      // Agregar referencia al movimiento
      cuenta.movimientos.push(data.movimientoId);
      
      await cuenta.save();
      
      this.logger.log(`Procesado movimiento ${data.movimientoId} para cuenta ${data.cuentaId}`);
    } catch (error) {
      this.logger.error(`Error al procesar movimiento: ${error.message}`);
      throw error;
    }
  }
  
  // Obtener todas las restricciones de una cuenta
  async getRestricciones(cuentaId: string): Promise<Restriccion[]> {
    const cuenta = await this.cuentaModel.findById(cuentaId).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
    
    return cuenta.restricciones;
  }

  // Actualizar una restricción específica
  async updateRestriccion(
    cuentaId: string, 
    restriccionId: string,
    updateRestriccionDto: UpdateRestriccionDto
  ): Promise<Cuenta> {
    const cuenta = await this.cuentaModel.findById(cuentaId).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
    
    // Buscar la restricción por ID
    const restriccionIndex = cuenta.restricciones.findIndex(
      r => r._id.toString() === restriccionId
    );
    
    if (restriccionIndex === -1) {
      throw new NotFoundException(`Restricción con ID ${restriccionId} no encontrada`);
    }
    
    // Validar que monto_desde sea menor que monto_hasta si ambos están presentes
    if (
      updateRestriccionDto.monto_desde !== undefined && 
      updateRestriccionDto.monto_hasta !== undefined &&
      updateRestriccionDto.monto_desde >= updateRestriccionDto.monto_hasta
    ) {
      throw new BadRequestException('El monto inicial debe ser menor que el monto final');
    }
    
    // Verificar solapamiento con otras restricciones
    if (updateRestriccionDto.monto_desde !== undefined || updateRestriccionDto.monto_hasta !== undefined) {
      const montoDesde = updateRestriccionDto.monto_desde ?? cuenta.restricciones[restriccionIndex].monto_desde;
      const montoHasta = updateRestriccionDto.monto_hasta ?? cuenta.restricciones[restriccionIndex].monto_hasta;
      
      const solapamiento = cuenta.restricciones.some((r, idx) => {
        if (idx === restriccionIndex) return false; // Excluir la restricción actual
        return (montoDesde <= r.monto_hasta && montoHasta >= r.monto_desde);
      });
      
      if (solapamiento) {
        throw new BadRequestException(`Los rangos de monto se solapan con restricciones existentes`);
      }
    }
    
    // Actualizar los campos de la restricción
    if (updateRestriccionDto.monto_desde !== undefined) {
      cuenta.restricciones[restriccionIndex].monto_desde = updateRestriccionDto.monto_desde;
    }
    
    if (updateRestriccionDto.monto_hasta !== undefined) {
      cuenta.restricciones[restriccionIndex].monto_hasta = updateRestriccionDto.monto_hasta;
    }
    
    if (updateRestriccionDto.patron_autenticacion !== undefined) {
      // Convertir a ObjectId si es string
      cuenta.restricciones[restriccionIndex].patron_autenticacion = 
        typeof updateRestriccionDto.patron_autenticacion === 'string'
          ? new (require('mongoose').Types.ObjectId)(updateRestriccionDto.patron_autenticacion)
          : updateRestriccionDto.patron_autenticacion;
    }
    
    return cuenta.save();
  }

}