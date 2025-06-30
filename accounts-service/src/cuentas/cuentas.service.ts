import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema } from 'mongoose';
import { Cuenta, EstadoCuenta, Restriccion } from 'shared-models';
import { CreateCuentaDto } from 'shared-models';
import { CreateRestriccionDto } from 'shared-models';
import { UpdateCuentaDto } from 'shared-models';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UpdateRestriccionDto } from './dto/update-restriccion.dto';
import { Transaccion, TransaccionSchema } from 'shared-models'
import { PatronAutenticacion } from 'shared-models';

@Injectable()
export class CuentasService {
  private readonly logger = new Logger(CuentasService.name);

  constructor(
    @InjectModel(Cuenta.name) private cuentaModel: Model<Cuenta>,
    @InjectModel(Transaccion.name) private trxModel: Model<Transaccion>,
    @InjectModel(PatronAutenticacion.name) private patternModel: Model<PatronAutenticacion>,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) { }

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
    // Si idCuenta viene como 'id1,id2', tomar solo el primero y validar
    const cuentaIdLimpio = (idCuenta || '').split(',')[0].trim();
    if (!Types.ObjectId.isValid(cuentaIdLimpio)) {
      throw new BadRequestException(`El parámetro idCuenta no es un ObjectId válido: ${cuentaIdLimpio}`);
    }

    const cuenta = await this.cuentaModel.findOne({ _id: cuentaIdLimpio }).exec();
    if (!cuenta) {
      throw new NotFoundException(`No se encontró la cuenta con ID ${cuentaIdLimpio}`);
    }

    // Buscar transacciones donde esta cuenta específica aparezca como origen o destino y estado válido
    const query = {
      $or: [
        { cuenta_origen: cuenta._id },
        { cuenta_destino: cuenta._id }
      ],
      estado: { $in: ['AUTORIZADA', 'COMPLETADA'] }
    };

    const transacciones = await this.trxModel.find(query)
      .sort({ createdAt: -1 }) // Más recientes primero
      .limit(50) // Limitar a los últimos 50 movimientos
      .exec();

    // Mapear las transacciones para devolver solo los datos relevantes con información de saldos
    return transacciones.map(transaccion => {
      const esOrigen = transaccion.cuenta_origen.toString() === cuenta._id.toString();

      // Calcular el saldo después de la transacción
      let saldo_anterior = null;
      let saldo_despues = null;

      if (esOrigen && transaccion.montoAnterior !== null && transaccion.montoAnterior !== undefined) {
        // Si es cuenta origen y tenemos el saldo anterior, calculamos el saldo después
        saldo_anterior = transaccion.montoAnterior;
        saldo_despues = transaccion.montoAnterior - transaccion.monto;
      }
      // Para cuenta destino, no tenemos el saldo anterior guardado, pero podríamos calcularlo
      // si es necesario mediante consultas adicionales

      return {
        _id: transaccion._id,
        numero_transaccion: transaccion.numero_transaccion,
        monto: transaccion.monto,
        descripcion: transaccion.descripcion || 'Transferencia',
        tipo: esOrigen ? 'SALIDA' : 'ENTRADA', // Desde la perspectiva de esta cuenta
        estado: transaccion.estado,
        fecha: transaccion.createdAt,

        // Información de la otra cuenta involucrada
        cuenta_contraparte: esOrigen ? transaccion.cuenta_destino : transaccion.cuenta_origen,

        // Información de saldos (solo disponible para cuenta origen)
        saldo_anterior: saldo_anterior,
        saldo_despues: saldo_despues,

        // Metadatos adicionales
        titular_cuenta: cuenta.titular,
        requiere_autenticacion: transaccion.requiere_autenticacion || false,
        fecha_procesamiento: transaccion.fecha_procesamiento,
      };
    });
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
    movimientoId: Schema.Types.ObjectId
  }): Promise<void> {
    const logger = new Logger('CuentasService.procesarMovimiento');

    try {
      logger.debug(`🔄 Procesando movimiento para cuenta ${data.cuentaId}`);
      logger.debug(`💰 Monto: ${data.monto}`);
      logger.debug(`🆔 MovimientoId: ${data.movimientoId}`);

      const cuenta = await this.cuentaModel.findById(data.cuentaId).exec();

      if (!cuenta) {
        logger.error(`❌ Cuenta con ID ${data.cuentaId} no encontrada`);
        throw new NotFoundException(`Cuenta con ID ${data.cuentaId} no encontrada`);
      }

      logger.debug(`📋 Cuenta encontrada: ${cuenta.numero_cuenta}, saldo actual: ${cuenta.monto_actual}`);


      // Actualizar fecha del último movimiento
      cuenta.fecha_ultimo_movimiento = new Date();

      await cuenta.save();

      logger.log(`✅ Movimiento ${data.movimientoId} procesado exitosamente para cuenta ${data.cuentaId}`);

    } catch (error) {
      logger.error(`❌ Error al procesar movimiento:`, error);
      logger.error(`📊 Datos recibidos:`, JSON.stringify(data));
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

  //Eliminar patrón
  async eliminarPatronAutenticacion(patronId: string): Promise<void> {
    // Validar ID
    if (!Types.ObjectId.isValid(patronId)) {
      throw new BadRequestException('El ID del patrón no es válido');
    }

    const patronObjectId = new Types.ObjectId(patronId);

    // Paso 1: Eliminar el patrón de la colección
    const resultado = await this.patternModel.deleteOne({ _id: patronObjectId }).exec();
    if (resultado.deletedCount === 0) {
      throw new NotFoundException(`No se encontró ningún patrón con ID ${patronId}`);
    }

    // Paso 2: Buscar todas las cuentas que contienen ese patrón en alguna restricción
    const cuentasConPatron = await this.cuentaModel.find({
      'restricciones.patron_autenticacion': patronObjectId
    }).exec();

    // Paso 3: Eliminar la referencia al patrón en cada cuenta
    for (const cuenta of cuentasConPatron) {
      let actualizado = false;

      for (const restriccion of cuenta.restricciones) {
        if (restriccion.patron_autenticacion?.toString() === patronId) {
          delete restriccion.patron_autenticacion;
          actualizado = true;
        }
      }

      if (actualizado) {
        await cuenta.save();
      }
    }

    this.logger.log(`Patrón ${patronId} eliminado y referencias limpiadas`);
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

    const restriccionIndex = cuenta.restricciones.findIndex(
      r => r._id.toString() === restriccionId
    );

    if (restriccionIndex === -1) {
      throw new NotFoundException(`Restricción con ID ${restriccionId} no encontrada`);
    }

    // Obtener los valores actuales para validación
    const restriccionActual = cuenta.restricciones[restriccionIndex];
    const montoDesdeNuevo = updateRestriccionDto.monto_desde !== undefined
      ? updateRestriccionDto.monto_desde
      : restriccionActual.monto_desde;
    const montoHastaNuevo = updateRestriccionDto.monto_hasta !== undefined
      ? updateRestriccionDto.monto_hasta
      : restriccionActual.monto_hasta;

    // ✅ VALIDAR RANGOS DE MONTOS
    if (montoDesdeNuevo >= montoHastaNuevo) {
      throw new BadRequestException('El monto inicial debe ser menor que el monto final');
    }

    // ✅ VALIDAR SOLAPAMIENTO CON OTRAS RESTRICCIONES (excluyendo la actual)
    const otrasRestricciones = cuenta.restricciones.filter((_, index) => index !== restriccionIndex);
    const solapamiento = otrasRestricciones.some(r =>
      montoDesdeNuevo <= r.monto_hasta && montoHastaNuevo >= r.monto_desde
    );

    if (solapamiento) {
      throw new BadRequestException('Los rangos de monto se solapan con restricciones existentes');
    }

    // ✅ MANEJO DEL PATRÓN: Solo actuar si se envía un nuevo patrón
    if (updateRestriccionDto.patron_autenticacion !== undefined) {
      const patronAnterior = cuenta.restricciones[restriccionIndex].patron_autenticacion;

      // ✅ VALIDACIÓN: Si se envía un patrón, verificar que sea válido (si no es null)
      if (updateRestriccionDto.patron_autenticacion !== null) {
        const patronId = updateRestriccionDto.patron_autenticacion;
        if (!Types.ObjectId.isValid(patronId)) {
          throw new BadRequestException(`ID de patrón inválido: ${patronId}`);
        }

        // Verificar que el patrón exista
        const patronExiste = await this.patternModel.findById(patronId).exec();
        if (!patronExiste) {
          throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
        }
      }

      // ✅ ELIMINAR PATRÓN ANTERIOR si está marcado para eliminación por seguridad
      if (updateRestriccionDto.debe_eliminar_patron_anterior === true && patronAnterior) {
        await this.patternModel.deleteOne({ _id: patronAnterior }).exec();
        this.logger.log(`Patrón anterior ${patronAnterior} eliminado por seguridad`);
      }
      // ✅ ASIGNAR NUEVO PATRÓN (puede ser null para eliminar sin reemplazar)
      if (updateRestriccionDto.patron_autenticacion === null) {
        // Eliminar referencia al patrón
        cuenta.restricciones[restriccionIndex].patron_autenticacion = undefined;
      } else {
        // Asignar nuevo patrón (CORREGIDO: usar string y dejar que Mongoose lo convierta)
        cuenta.restricciones[restriccionIndex].patron_autenticacion = updateRestriccionDto.patron_autenticacion as any;
      }
    }
    // ✅ ACTUALIZAR MONTOS
    if (updateRestriccionDto.monto_desde !== undefined) {
      this.logger.log(`Actualizando monto_desde de ${cuenta.restricciones[restriccionIndex].monto_desde} a ${updateRestriccionDto.monto_desde}`);
      cuenta.restricciones[restriccionIndex].monto_desde = updateRestriccionDto.monto_desde;
    }

    if (updateRestriccionDto.monto_hasta !== undefined) {
      this.logger.log(`Actualizando monto_hasta de ${cuenta.restricciones[restriccionIndex].monto_hasta} a ${updateRestriccionDto.monto_hasta}`);
      cuenta.restricciones[restriccionIndex].monto_hasta = updateRestriccionDto.monto_hasta;
    }

    // ✅ MARCAR COMO MODIFICADO una sola vez al final
    cuenta.markModified('restricciones');

    this.logger.log(`Restricción ${restriccionId} actualizada en cuenta ${cuentaId}`);
    this.logger.log(`Restricción después de modificar:`, JSON.stringify(cuenta.restricciones[restriccionIndex], null, 2));
    return cuenta.save();
  }


  async validarTransaccionConPatrones(body: {
    cuentaId: string;
    monto: string;
    sensorIds: string[];
  }) {
    const { cuentaId, monto, sensorIds } = body;
    const montoNumerico = parseFloat(monto);

    console.log('\n=== VALIDACIÓN DE TRANSACCIÓN CON PATRONES ===');
    console.log('CuentaId:', cuentaId);
    console.log('Monto:', montoNumerico);
    console.log('SensorIds recibidos:', sensorIds);

    // Paso 1: Obtener cuenta
    const cuenta = await this.cuentaModel.findById(cuentaId);
    if (!cuenta) {
      return { valid: false, message: 'Cuenta no encontrada.' };
    }

    // Paso 2: Verificar estado de la cuenta
    if (cuenta.estado !== 'ACTIVA') {
      return { valid: false, message: 'La cuenta no está activa.' };
    }

    // Paso 3: Buscar restricción aplicable
    const restriccionAplicable = cuenta.restricciones.find(r =>
      montoNumerico >= r.monto_desde && montoNumerico <= r.monto_hasta
    );

    console.log('Restricción aplicable:', restriccionAplicable);

    if (!restriccionAplicable) {
      // Sin restricción = transacción válida
      return {
        valid: true,
        message: 'Transacción válida sin autenticación requerida.',
        requiere_autenticacion: false
      };
    }

    if (!restriccionAplicable.patron_autenticacion) {
      // Restricción sin patrón = transacción válida
      return {
        valid: true,
        message: 'Restricción encontrada pero sin patrón de autenticación requerido.',
        requiere_autenticacion: false
      };
    }

    // Paso 4: Validar patrón de autenticación
    console.log('Validando patrón:', restriccionAplicable.patron_autenticacion);

    try {
      // Aquí deberías llamar al microservicio de patterns
      // Por ahora valido directamente en este servicio

      // Obtener el patrón de autenticación
      const patron = await this.patternModel
        .findById(restriccionAplicable.patron_autenticacion)
        .exec();

      if (!patron || !patron.activo) {
        return {
          valid: false,
          message: 'Patrón de autenticación no encontrado o inactivo.'
        };
      }

      // Buscar dedos patrón asociados al usuario
      const cuentaApp = await this.getCuentaAppByTitular(cuenta.titular.toString());
      if (!cuentaApp) {
        return { valid: false, message: 'Usuario no encontrado.' };
      }

      // Obtener dedos patrón del usuario que están en el patrón de autenticación
      const dedosPatronUsuario = await this.getDedosPatronUsuario(cuentaApp._id);
      const dedosEnPatron = patron.dedos_patron.filter(dedoId =>
        dedosPatronUsuario.some(dpu => dpu._id.toString() === dedoId.toString())
      );

      if (dedosEnPatron.length === 0) {
        return {
          valid: false,
          message: 'No se encontraron dedos del usuario en el patrón requerido.'
        };
      }

      // Validar cada sensorId recibido
      let coincidencias = 0;

      for (const sensorId of sensorIds) {
        for (const dedoPatronId of dedosEnPatron) {
          const dedoPatron = dedosPatronUsuario.find(d => d._id.toString() === dedoPatronId.toString());

          if (dedoPatron && dedoPatron.dedos_registrados?.huella) {
            if (this.verifySensorId(sensorId, dedoPatron.dedos_registrados.huella)) {
              coincidencias++;
              break; // Salir del loop interno cuando encuentra coincidencia
            }
          }
        }
      }

      const coincidenciasRequeridas = Math.min(3, dedosEnPatron.length);
      const esValido = coincidencias >= coincidenciasRequeridas;

      return {
        valid: esValido,
        message: esValido
          ? 'Patrón válido. Transacción autorizada.'
          : `Autenticación fallida. Se encontraron ${coincidencias}/${coincidenciasRequeridas} huellas válidas.`,
        coincidencias,
        requeridas: coincidenciasRequeridas,
        patron_usado: patron._id
      };

    } catch (error) {
      this.logger.error(`Error en validación de patrón: ${error.message}`);
      return {
        valid: false,
        message: `Error en validación: ${error.message}`
      };
    }
  }

  // MÉTODOS AUXILIARES NECESARIOS:

  private async getCuentaAppByTitular(titularId: string) {
    // Aquí deberías llamar al microservicio de usuarios
    // Para obtener la cuenta app del titular
    try {
      return await firstValueFrom(
        this.usersClient.send('users.getCuentaAppByPersona', titularId)
      );
    } catch (error) {
      this.logger.error(`Error al obtener cuenta app: ${error.message}`);
      return null;
    }
  }

  private async getDedosPatronUsuario(cuentaAppId: string) {
    // Este método debería llamar al microservicio de fingerprints/patterns
    // Para obtener los dedos patrón del usuario
    // Por simplicidad, aquí muestro la lógica directa:

    // En un ambiente real, esto sería una llamada a otro microservicio:
    // return await firstValueFrom(
    //   this.patternsClient.send('patterns.getDedosPatronByCuentaApp', cuentaAppId)
    // );

    // Lógica temporal (deberías moverla al microservicio correspondiente):
    return []; // Placeholder
  }

  private verifySensorId(sensorId: string, storedHash: string): boolean {
    try {
      const ENCRYPTION_KEY = process.env.FINGERPRINT_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';

      const parts = storedHash.split(':');
      if (parts.length !== 2) return false;

      const [salt, expectedHash] = parts;

      const dataToHash = sensorId + ENCRYPTION_KEY + salt;
      const calculatedHash = require('crypto')
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex');

      return calculatedHash === expectedHash;
    } catch (error) {
      return false;
    }
  }

}