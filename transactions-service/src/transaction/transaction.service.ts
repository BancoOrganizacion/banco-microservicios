import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Transaccion, TipoTransaccion, EstadoTransaccion } from './schemas/transaction.schema';
import { TransferirDto } from './dto/transferencia.dto';
import { ValidarTransaccionDto } from './dto/validar-transaccion.dto';
import { AutorizarTransaccionDto } from './dto/autorizar-transaccion.dto';
import { QueryTransaccionesDto } from './dto/query-transacciones.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectModel(Transaccion.name) private transaccionModel: Model<Transaccion>,
    @Inject('ACCOUNTS_SERVICE') private readonly accountsClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  private async generarNumeroTransaccion(): Promise<string> {
    const prefix = 'TXN';
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
  }

   private async obtenerCuentaPorNumero(numeroCuenta: string): Promise<any> {
    try {
      this.logger.debug(`Buscando cuenta con número: ${numeroCuenta}`);
      const cuenta = await firstValueFrom(
        this.accountsClient.send('accounts.findByNumeroCuenta', numeroCuenta)
      );
      this.logger.debug(`Cuenta encontrada: ${cuenta._id}, saldo: ${cuenta.monto_actual}`);
      return cuenta;
    } catch (error) {
      this.logger.error(`Error al buscar cuenta ${numeroCuenta}: ${error.message}`, error.stack);
      throw new NotFoundException(`Cuenta con número ${numeroCuenta} no encontrada`);
    }
  }

   private async obtenerCuentaPorId(cuentaId: string): Promise<any> {
    try {
      this.logger.debug(`Buscando cuenta por ID: ${cuentaId}`);
      const cuenta = await firstValueFrom(
        this.accountsClient.send('accounts.findById', cuentaId)
      );
      this.logger.debug(`Cuenta por ID encontrada: ${cuenta._id}, saldo: ${cuenta.monto_actual}`);
      return cuenta;
    } catch (error) {
      this.logger.error(`Error al buscar cuenta por ID ${cuentaId}: ${error.message}`, error.stack);
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
  }

  /**
   * TRANSFERENCIAS - Ahora guarda el saldo anterior de la cuenta origen
   */
 async transferir(transferirDto: TransferirDto, usuarioId: string): Promise<Transaccion> {
    this.logger.debug(`=== INICIANDO TRANSFERENCIA ===`);
    this.logger.debug(`Usuario: ${usuarioId}`);
    this.logger.debug(`Datos: ${JSON.stringify(transferirDto)}`);

    try {
      if (transferirDto.numero_cuenta_origen === transferirDto.numero_cuenta_destino) {
        throw new BadRequestException('La cuenta origen y destino no pueden ser la misma');
      }

      // Buscar cuentas por número de cuenta
      this.logger.debug(`Paso 1: Buscando cuentas...`);
      const cuentaOrigen = await this.obtenerCuentaPorNumero(transferirDto.numero_cuenta_origen);
      const cuentaDestino = await this.obtenerCuentaPorNumero(transferirDto.numero_cuenta_destino);

      // Verificar que el usuario es propietario de la cuenta origen
      /* PARA TEST DEL MICROCONTROLADOR
      this.logger.debug(`Paso 2: Verificando propietario...`);
      this.logger.debug(`Titular cuenta origen: ${cuentaOrigen.titular}, Usuario: ${usuarioId}`);
      if (cuentaOrigen.titular.toString() !== usuarioId) {
        throw new BadRequestException('No tienes permiso para usar esta cuenta origen');
      }*/

      // Verificar saldo suficiente
      this.logger.debug(`Paso 3: Verificando saldo...`);
      this.logger.debug(`Saldo actual: ${cuentaOrigen.monto_actual}, Monto a transferir: ${transferirDto.monto}`);
      if (cuentaOrigen.monto_actual < transferirDto.monto) {
        throw new BadRequestException('Saldo insuficiente para realizar la transferencia');
      }

      this.logger.debug(`Paso 4: Verificando restricciones...`);
      const restriccionesValidas = await this.verificarRestricciones(
        cuentaOrigen._id.toString(), 
        transferirDto.monto
      );
      this.logger.debug(`Restricciones: ${JSON.stringify(restriccionesValidas)}`);

      this.logger.debug(`Paso 5: Generando número de transacción...`);
      const numeroTransaccion = await this.generarNumeroTransaccion();
      this.logger.debug(`Número generado: ${numeroTransaccion}`);
      
      // CREAR TRANSACCIÓN CON SALDO ANTERIOR
      this.logger.debug(`Paso 6: Creando transacción...`);
      const datosTransaccion = {
        numero_transaccion: numeroTransaccion,
        tipo: TipoTransaccion.TRANSFERENCIA,
        monto: transferirDto.monto,
        montoAnterior: cuentaOrigen.monto_actual,
        cuenta_origen: cuentaOrigen._id,
        cuenta_destino: cuentaDestino._id,
        descripcion: transferirDto.descripcion || 'Transferencia entre cuentas',
        estado: restriccionesValidas.requiere_autenticacion ? 
          EstadoTransaccion.PENDIENTE : EstadoTransaccion.AUTORIZADA,
        usuario_ejecutor: usuarioId,
        requiere_autenticacion: restriccionesValidas.requiere_autenticacion,
      };

      this.logger.debug(`Datos de transacción a guardar: ${JSON.stringify(datosTransaccion)}`);
      
      const nuevaTransaccion = new this.transaccionModel(datosTransaccion);
      const transaccionGuardada = await nuevaTransaccion.save();
      
      this.logger.debug(`Transacción guardada con ID: ${transaccionGuardada._id}`);

      // Si no requiere autenticación, procesar inmediatamente
      if (!restriccionesValidas.requiere_autenticacion) {
        this.logger.debug(`Paso 7: Procesando transacción inmediatamente...`);
        await this.procesarTransaccion(transaccionGuardada._id.toString());
      } else {
        this.logger.debug(`Transacción queda pendiente de autenticación`);
      }

      this.logger.debug(`=== TRANSFERENCIA COMPLETADA EXITOSAMENTE ===`);
      return transaccionGuardada;

    } catch (error) {
      this.logger.error(`=== ERROR EN TRANSFERENCIA ===`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      this.logger.error(`Tipo de error: ${error.constructor.name}`);
      throw error;
    }
  }

  /**
   * PROCESAMIENTO DE TRANSACCIONES
   */
private async procesarTransaccion(transaccionId: string): Promise<void> {
    this.logger.debug(`=== INICIANDO PROCESAMIENTO DE TRANSACCIÓN ===`);
    this.logger.debug(`ID de transacción: ${transaccionId}`);

    try {
      this.logger.debug(`Paso 1: Buscando transacción...`);
      const transaccion = await this.transaccionModel.findById(transaccionId).exec();
      
      if (!transaccion) {
        throw new BadRequestException(`Transacción ${transaccionId} no encontrada`);
      }

      this.logger.debug(`Transacción encontrada: ${transaccion.numero_transaccion}, estado: ${transaccion.estado}`);
      
      if (transaccion.estado !== EstadoTransaccion.AUTORIZADA) {
        throw new BadRequestException('Transacción no autorizada para procesamiento');
      }

      // VERIFICAR SALDO ACTUAL ANTES DE PROCESAR
      this.logger.debug(`Paso 2: Verificando saldo actual...`);
      const cuentaOrigenActual = await this.obtenerCuentaPorId(transaccion.cuenta_origen.toString());

      // Verificar si el saldo sigue siendo suficiente
      this.logger.debug(`Saldo actual: ${cuentaOrigenActual.monto_actual}, Monto a debitar: ${transaccion.monto}`);
      if (cuentaOrigenActual.monto_actual < transaccion.monto) {
        this.logger.warn(`Saldo insuficiente al momento del procesamiento`);
        
        transaccion.montoAnterior = cuentaOrigenActual.monto_actual;
        transaccion.estado = EstadoTransaccion.FALLIDA;
        transaccion.motivo_fallo = 'Saldo insuficiente al momento del procesamiento';
        await transaccion.save();
        throw new BadRequestException('Saldo insuficiente al momento del procesamiento');
      }

      // ACTUALIZAR EL SALDO ANTERIOR CON EL SALDO REAL AL MOMENTO DEL PROCESAMIENTO
      this.logger.debug(`Paso 3: Actualizando saldo anterior...`);
      transaccion.montoAnterior = cuentaOrigenActual.monto_actual;

      this.logger.debug(`Paso 4: Procesando transferencia...`);
      await this.procesarTransferencia(transaccion);

      this.logger.debug(`Paso 5: Actualizando estado de transacción...`);
      transaccion.estado = EstadoTransaccion.COMPLETADA;
      transaccion.fecha_procesamiento = new Date();
      await transaccion.save();

      this.logger.log(`=== TRANSACCIÓN ${transaccionId} PROCESADA EXITOSAMENTE ===`);

    } catch (error) {
      this.logger.error(`=== ERROR PROCESANDO TRANSACCIÓN ${transaccionId} ===`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      
      // En caso de error, actualizar con el saldo actual sin cambios
      try {
        const transaccion = await this.transaccionModel.findById(transaccionId).exec();
        if (transaccion) {
          const cuentaOrigenActual = await this.obtenerCuentaPorId(transaccion.cuenta_origen.toString());
          
          await this.transaccionModel.findByIdAndUpdate(transaccionId, {
            estado: EstadoTransaccion.FALLIDA,
            motivo_fallo: error.message,
            montoAnterior: cuentaOrigenActual.monto_actual,
          });

          this.logger.debug(`Estado de transacción actualizado a FALLIDA`);
        }
      } catch (updateError) {
        this.logger.error(`Error actualizando estado de transacción fallida: ${updateError.message}`);
      }
      
      throw error;
    }
  }

  /**
   * CONSULTAS MEJORADAS - Ahora incluye información de saldos
   */
  async obtenerTransferencias(usuarioId: string, query: QueryTransaccionesDto): Promise<any> {
    const filtros: any = {
      usuario_ejecutor: usuarioId,
      tipo: TipoTransaccion.TRANSFERENCIA
    };

    if (query.fecha_inicio && query.fecha_fin) {
      filtros.createdAt = {
        $gte: new Date(query.fecha_inicio),
        $lte: new Date(query.fecha_fin)
      };
    }

    if (query.estado) {
      filtros.estado = query.estado;
    }

    const skip = (query.page - 1) * query.limit;

    const [transacciones, total] = await Promise.all([
      this.transaccionModel
        .find(filtros)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.transaccionModel.countDocuments(filtros)
    ]);

    // Formatear transacciones con información de saldos
    const transaccionesConSaldos = transacciones.map((transaccion) => ({
      _id: transaccion._id,
      numero_transaccion: transaccion.numero_transaccion,
      tipo: transaccion.tipo,
      monto: transaccion.monto,
      descripcion: transaccion.descripcion,
      estado: transaccion.estado,
      fecha_creacion: transaccion.createdAt,
      fecha_procesamiento: transaccion.fecha_procesamiento,
      
      // INFORMACIÓN DE SALDO
      saldo_anterior: transaccion.montoAnterior,
      saldo_despues: transaccion.montoAnterior - transaccion.monto, // Calculado
    }));

    return {
      transacciones: transaccionesConSaldos,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    };
  }

  /**
   * Obtener movimientos de una cuenta específica
   */
  async obtenerMovimientosCuenta(cuentaId: string): Promise<any[]> {
    const movimientos = await this.transaccionModel
      .find({
        $or: [
          { cuenta_origen: cuentaId },
          { cuenta_destino: cuentaId }
        ],
        estado: { $in: [EstadoTransaccion.COMPLETADA, EstadoTransaccion.AUTORIZADA] }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Formatear movimientos
    return movimientos.map(mov => {
      const esOrigen = mov.cuenta_origen.toString() === cuentaId;
      
      return {
        _id: mov._id,
        numero_transaccion: mov.numero_transaccion,
        tipo: mov.tipo,
        monto: mov.monto,
        descripcion: mov.descripcion,
        fecha: mov.createdAt,
        estado: mov.estado,
        
        // Solo mostramos el saldo si esta cuenta es la origen (donde tenemos el dato)
        saldo_anterior: esOrigen ? mov.montoAnterior : null,
        saldo_despues: esOrigen ? mov.montoAnterior - mov.monto : null,
        
        // Tipo de movimiento desde la perspectiva de esta cuenta
        tipo_movimiento: esOrigen ? 'SALIDA' : 'ENTRADA',
      };
    });
  }

  // ... resto de métodos permanecen igual
  async validarTransaccion(validarDto: ValidarTransaccionDto): Promise<any> {
    this.logger.debug(`Validando transacción: ${JSON.stringify(validarDto)}`);

    const cuentaOrigen = await this.obtenerCuentaPorNumero(validarDto.numero_cuenta_origen);
    const cuentaDestino = await this.obtenerCuentaPorNumero(validarDto.numero_cuenta_destino);

    const validaciones = {
      saldo_suficiente: cuentaOrigen.monto_actual >= validarDto.monto,
      cuenta_activa: cuentaOrigen.estado === 'ACTIVA',
      cuenta_destino_activa: cuentaDestino.estado === 'ACTIVA',
      monto_valido: validarDto.monto > 0,
      monto_total: validarDto.monto
    };

    const restricciones = await this.verificarRestricciones(
      cuentaOrigen._id.toString(),
      validarDto.monto
    );

    return {
      es_valida: Object.values(validaciones).every(v => v === true),
      validaciones,
      restricciones,
      requiere_autenticacion: restricciones.requiere_autenticacion
    };
  }

  async autorizarTransaccion(autorizarDto: AutorizarTransaccionDto): Promise<Transaccion> {
    this.logger.debug(`Autorizando transacción: ${autorizarDto.transaccion_id}`);

    const transaccion = await this.transaccionModel.findById(autorizarDto.transaccion_id).exec();
    
    if (!transaccion) {
      throw new NotFoundException(`Transacción con ID ${autorizarDto.transaccion_id} no encontrada`);
    }

    if (transaccion.estado !== EstadoTransaccion.PENDIENTE) {
      throw new BadRequestException('La transacción no está en estado pendiente');
    }

    transaccion.estado = EstadoTransaccion.AUTORIZADA;
    transaccion.fecha_autorizacion = new Date();
    transaccion.codigo_verificacion = autorizarDto.codigo_verificacion;
    
    const transaccionAutorizada = await transaccion.save();
    await this.procesarTransaccion(transaccionAutorizada._id.toString());

    return transaccionAutorizada;
  }

 async verificarRestricciones(cuentaId: string, monto: number): Promise<any> {
    try {
      this.logger.debug(`Verificando restricciones para cuenta ${cuentaId}, monto: ${monto}`);
      
      const restricciones = await firstValueFrom(
        this.accountsClient.send('accounts.getRestricciones', cuentaId)
      );

      this.logger.debug(`Restricciones encontradas: ${JSON.stringify(restricciones)}`);

      const restriccionAplicable = restricciones.find(r => 
        monto >= r.monto_desde && monto <= r.monto_hasta
      );

      const resultado = {
        requiere_autenticacion: !!restriccionAplicable,
        restriccion_aplicable: restriccionAplicable,
        patron_requerido: restriccionAplicable?.patron_autenticacion
      };

      this.logger.debug(`Resultado verificación restricciones: ${JSON.stringify(resultado)}`);
      return resultado;

    } catch (error) {
      this.logger.error(`Error al verificar restricciones: ${error.message}`, error.stack);
      return {
        requiere_autenticacion: false,
        restriccion_aplicable: null,
        patron_requerido: null
      };
    }
  }

 private async procesarTransferencia(transaccion: Transaccion): Promise<void> {
    this.logger.debug(`=== PROCESANDO TRANSFERENCIA BANCARIA ===`);
    
    try {
      // Debitar cuenta origen
      this.logger.debug(`Paso 1: Debitando cuenta origen...`);
      this.logger.debug(`Cuenta origen: ${transaccion.cuenta_origen}, Monto: ${-transaccion.monto}`);
      
      const resultadoDebito = await firstValueFrom(
        this.accountsClient.send('accounts.actualizarSaldo', {
          cuentaId: transaccion.cuenta_origen,
          monto: -transaccion.monto
        })
      );
      this.logger.debug(`Resultado débito: ${JSON.stringify(resultadoDebito)}`);

      // Acreditar cuenta destino
      this.logger.debug(`Paso 2: Acreditando cuenta destino...`);
      this.logger.debug(`Cuenta destino: ${transaccion.cuenta_destino}, Monto: ${transaccion.monto}`);
      
      const resultadoCredito = await firstValueFrom(
        this.accountsClient.send('accounts.actualizarSaldo', {
          cuentaId: transaccion.cuenta_destino,
          monto: transaccion.monto
        })
      );
      this.logger.debug(`Resultado crédito: ${JSON.stringify(resultadoCredito)}`);

      // Registrar movimientos
      this.logger.debug(`Paso 3: Registrando movimientos...`);
      
      const movimientoOrigen = firstValueFrom(
        this.accountsClient.send('accounts.procesarMovimiento', {
          cuentaId: transaccion.cuenta_origen,
          monto: -transaccion.monto, 
          movimientoId: transaccion._id
        })
      );

      const movimientoDestino = firstValueFrom(
        this.accountsClient.send('accounts.procesarMovimiento', {
          cuentaId: transaccion.cuenta_destino,
          monto: transaccion.monto,
          movimientoId: transaccion._id
        })
      );

      const resultadosMovimientos = await Promise.all([movimientoOrigen, movimientoDestino]);
      this.logger.debug(`Movimientos registrados: ${JSON.stringify(resultadosMovimientos)}`);

      this.logger.debug(`=== TRANSFERENCIA BANCARIA COMPLETADA ===`);

    } catch (error) {
      this.logger.error(`=== ERROR EN TRANSFERENCIA BANCARIA ===`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }
}