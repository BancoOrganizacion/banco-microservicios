import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Cuenta, EstadoCuenta } from 'shared-models';
import { CreateCuentaDto } from 'shared-models';
import { CreateRestriccionDto } from 'shared-models';
import { UpdateCuentaDto } from 'shared-models';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CuentasService {
  private readonly logger = new Logger(CuentasService.name);

  constructor(
    @InjectModel(Cuenta.name) private cuentaModel: Model<Cuenta>,
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
    
    // Validar si el patrón de autenticación existe (si se proporciona)
    if (restriccion.patron_autenticacion) {
      // Aquí iría la lógica para validar con el microservicio de autenticación
      // Por ahora, continuamos asumiendo que el patrón existe
    }
    
    // Validar que los rangos no se solapen con restricciones existentes
    const solapamiento = cuenta.restricciones.some(r => 
      (restriccion.monto_desde <= r.monto_hasta && restriccion.monto_hasta >= r.monto_desde)
    );
    
    if (solapamiento) {
      throw new BadRequestException(`Los rangos de monto se solapan con restricciones existentes`);
    }
    


    // Añadir la restricción, verificar como hacer que se añada la restriccion. se necesita convertir
    //cuenta.restricciones.push(restriccion);
    return cuenta.save();
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
  async getMovimientos(cuentaId: string): Promise<any[]> {
    const cuenta = await this.cuentaModel.findById(cuentaId).exec();
    
    if (!cuenta) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
    
    // Por ahora retornamos un arreglo vacío
    // En el futuro, se comunicará con el microservicio de movimientos
    return [];
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
  
}