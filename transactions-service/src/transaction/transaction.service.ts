import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Transaccion, TipoTransaccion, EstadoTransaccion } from './schemas/transaction.schema';
import { TransferirDto } from './dto/transferencia.dto';
import { DepositarDto } from './dto/deposito.dto';
import { RetirarDto } from './dto/retiro.dto';
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
    // @Inject('PATTERNS_SERVICE') private readonly patternsClient: ClientProxy, // Para validación biométrica
  ) {}

  /**
   * Genera un número de transacción único
   */
  private async generarNumeroTransaccion(): Promise<string> {
    const prefix = 'TXN';
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Obtiene información de una cuenta desde el microservicio de cuentas
   */
  private async obtenerCuenta(cuentaId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.accountsClient.send('accounts.findById', cuentaId)
      );
    } catch (error) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
  }

  /**
   * Calcula comisión según el tipo de transacción y monto
   */
  private calcularComision(tipo: TipoTransaccion, monto: number): number {
    switch (tipo) {
      case TipoTransaccion.TRANSFERENCIA:
        return monto * 0.001; // 0.1%
      case TipoTransaccion.RETIRO:
        return 2.00; // $2 fijo
      case TipoTransaccion.DEPOSITO:
        return 0; // Sin comisión
      default:
        return 0;
    }
  }

  /**
   * TRANSFERENCIAS
   */
  async transferir(transferirDto: TransferirDto, usuarioId: string): Promise<Transaccion> {
    this.logger.debug(`Iniciando transferencia: ${JSON.stringify(transferirDto)}`);

    if (transferirDto.cuenta_origen === transferirDto.cuenta_destino) {
      throw new BadRequestException('La cuenta origen y destino no pueden ser la misma');
    }

    const cuentaOrigen = await this.obtenerCuenta(transferirDto.cuenta_origen);
    const cuentaDestino = await this.obtenerCuenta(transferirDto.cuenta_destino);

    const comision = this.calcularComision(TipoTransaccion.TRANSFERENCIA, transferirDto.monto);
    const montoTotal = transferirDto.monto + comision;

    if (cuentaOrigen.monto_actual < montoTotal) {
      throw new BadRequestException('Saldo insuficiente para realizar la transferencia');
    }

    const restriccionesValidas = await this.verificarRestricciones(
      transferirDto.cuenta_origen, 
      transferirDto.monto
    );

    const numeroTransaccion = await this.generarNumeroTransaccion();
    
    const nuevaTransaccion = new this.transaccionModel({
      numero_transaccion: numeroTransaccion,
      tipo: TipoTransaccion.TRANSFERENCIA,
      monto: transferirDto.monto,
      cuenta_origen: transferirDto.cuenta_origen,
      cuenta_destino: transferirDto.cuenta_destino,
      descripcion: transferirDto.descripcion || 'Transferencia entre cuentas',
      estado: restriccionesValidas.requiere_autenticacion ? 
        EstadoTransaccion.PENDIENTE : EstadoTransaccion.AUTORIZADA,
      comision,
      usuario_ejecutor: usuarioId,
      requiere_autenticacion: restriccionesValidas.requiere_autenticacion,
    });

    const transaccionGuardada = await nuevaTransaccion.save();

    if (!restriccionesValidas.requiere_autenticacion) {
      await this.procesarTransaccion(transaccionGuardada._id.toString());
    }

    return transaccionGuardada;
  }

  /**
   * DEPÓSITOS
   */
  async depositar(depositarDto: DepositarDto, usuarioId: string): Promise<Transaccion> {
    this.logger.debug(`Iniciando depósito: ${JSON.stringify(depositarDto)}`);

    const cuentaDestino = await this.obtenerCuenta(depositarDto.cuenta_destino);

    const numeroTransaccion = await this.generarNumeroTransaccion();
    
    const nuevaTransaccion = new this.transaccionModel({
      numero_transaccion: numeroTransaccion,
      tipo: TipoTransaccion.DEPOSITO,
      monto: depositarDto.monto,
      cuenta_origen: depositarDto.cuenta_destino,
      descripcion: depositarDto.descripcion || 'Depósito en cuenta',
      estado: EstadoTransaccion.AUTORIZADA,
      comision: 0,
      usuario_ejecutor: usuarioId,
      referencia_externa: depositarDto.referencia_externa,
      requiere_autenticacion: false,
    });

    const transaccionGuardada = await nuevaTransaccion.save();
    await this.procesarTransaccion(transaccionGuardada._id.toString());

    return transaccionGuardada;
  }

  /**
   * RETIROS
   */
  async retirar(retirarDto: RetirarDto, usuarioId: string): Promise<Transaccion> {
    this.logger.debug(`Iniciando retiro: ${JSON.stringify(retirarDto)}`);

    const cuentaOrigen = await this.obtenerCuenta(retirarDto.cuenta_origen);

    const comision = this.calcularComision(TipoTransaccion.RETIRO, retirarDto.monto);
    const montoTotal = retirarDto.monto + comision;

    if (cuentaOrigen.monto_actual < montoTotal) {
      throw new BadRequestException('Saldo insuficiente para realizar el retiro');
    }

    const restriccionesValidas = await this.verificarRestricciones(
      retirarDto.cuenta_origen, 
      retirarDto.monto
    );

    const numeroTransaccion = await this.generarNumeroTransaccion();
    
    const nuevaTransaccion = new this.transaccionModel({
      numero_transaccion: numeroTransaccion,
      tipo: TipoTransaccion.RETIRO,
      monto: retirarDto.monto,
      cuenta_origen: retirarDto.cuenta_origen,
      descripcion: retirarDto.descripcion || 'Retiro de cuenta',
      estado: restriccionesValidas.requiere_autenticacion ? 
        EstadoTransaccion.PENDIENTE : EstadoTransaccion.AUTORIZADA,
      comision,
      usuario_ejecutor: usuarioId,
      requiere_autenticacion: restriccionesValidas.requiere_autenticacion,
    });

    const transaccionGuardada = await nuevaTransaccion.save();

    if (!restriccionesValidas.requiere_autenticacion) {
      await this.procesarTransaccion(transaccionGuardada._id.toString());
    }

    return transaccionGuardada;
  }

  /**
   * CONSULTAS
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
        .populate('cuenta_origen cuenta_destino')
        .exec(),
      this.transaccionModel.countDocuments(filtros)
    ]);

    return {
      transacciones,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    };
  }

  async obtenerTransferenciaPorId(id: string, usuarioId: string): Promise<Transaccion> {
    const transferencia = await this.transaccionModel
      .findOne({
        _id: id,
        tipo: TipoTransaccion.TRANSFERENCIA,
        usuario_ejecutor: usuarioId
      })
      .populate('cuenta_origen cuenta_destino')
      .exec();

    if (!transferencia) {
      throw new NotFoundException(`Transferencia con ID ${id} no encontrada`);
    }

    return transferencia;
  }

  async obtenerRetiros(usuarioId: string, query: QueryTransaccionesDto): Promise<any> {
    const filtros: any = {
      usuario_ejecutor: usuarioId,
      tipo: TipoTransaccion.RETIRO
    };

    const skip = (query.page - 1) * query.limit;

    const [transacciones, total] = await Promise.all([
      this.transaccionModel
        .find(filtros)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('cuenta_origen')
        .exec(),
      this.transaccionModel.countDocuments(filtros)
    ]);

    return {
      transacciones,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    };
  }

  async obtenerMovimientosCuenta(cuentaId: string): Promise<Transaccion[]> {
    return this.transaccionModel
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
  }

  async consultarSaldo(cuentaId: string): Promise<any> {
    const cuenta = await this.obtenerCuenta(cuentaId);
    const movimientos = await this.obtenerMovimientosCuenta(cuentaId);

    return {
      cuenta_id: cuentaId,
      numero_cuenta: cuenta.numero_cuenta,
      saldo_actual: cuenta.monto_actual,
      fecha_ultimo_movimiento: cuenta.fecha_ultimo_movimiento,
      ultimos_movimientos: movimientos.slice(0, 5)
    };
  }

  /**
   * VALIDACIÓN Y AUTORIZACIÓN
   */
  async validarTransaccion(validarDto: ValidarTransaccionDto): Promise<any> {
    this.logger.debug(`Validando transacción: ${JSON.stringify(validarDto)}`);

    const cuentaOrigen = await this.obtenerCuenta(validarDto.cuenta_origen);

    const tipoTransaccion = validarDto.tipo as TipoTransaccion;
    const comision = this.calcularComision(tipoTransaccion, validarDto.monto);
    const montoTotal = validarDto.monto + comision;

    const validaciones = {
      saldo_suficiente: cuentaOrigen.monto_actual >= montoTotal,
      cuenta_activa: cuentaOrigen.estado === 'ACTIVA',
      monto_valido: validarDto.monto > 0,
      comision_calculada: comision,
      monto_total: montoTotal
    };

    const restricciones = await this.verificarRestricciones(
      validarDto.cuenta_origen,
      validarDto.monto
    );

    if (validarDto.cuenta_destino) {
      const cuentaDestino = await this.obtenerCuenta(validarDto.cuenta_destino);
      validaciones['cuenta_destino_activa'] = cuentaDestino.estado === 'ACTIVA';
    }

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

    // TODO: Validar código de verificación con auth service
    // const codigoValido = await firstValueFrom(
    //   this.authClient.send('auth.validateCode', {
    //     userId: transaccion.usuario_ejecutor,
    //     code: autorizarDto.codigo_verificacion
    //   })
    // );

    // TODO: Si hay patrón biométrico, validarlo con patterns service
    // if (autorizarDto.patron_autenticacion_id) {
    //   const patronValido = await firstValueFrom(
    //     this.patternsClient.send('patterns.validate', autorizarDto.patron_autenticacion_id)
    //   );
    // }

    transaccion.estado = EstadoTransaccion.AUTORIZADA;
    transaccion.fecha_autorizacion = new Date();
    transaccion.codigo_verificacion = autorizarDto.codigo_verificacion;
    
    const transaccionAutorizada = await transaccion.save();
    await this.procesarTransaccion(transaccionAutorizada._id.toString());

    return transaccionAutorizada;
  }

  async verificarRestricciones(cuentaId: string, monto: number): Promise<any> {
    try {
      const restricciones = await firstValueFrom(
        this.accountsClient.send('accounts.getRestricciones', cuentaId)
      );

      const restriccionAplicable = restricciones.find(r => 
        monto >= r.monto_desde && monto <= r.monto_hasta
      );

      return {
        requiere_autenticacion: !!restriccionAplicable,
        restriccion_aplicable: restriccionAplicable,
        patron_requerido: restriccionAplicable?.patron_autenticacion
      };
    } catch (error) {
      this.logger.error(`Error al verificar restricciones: ${error.message}`);
      return {
        requiere_autenticacion: false,
        restriccion_aplicable: null,
        patron_requerido: null
      };
    }
  }

  /**
   * PROCESAMIENTO DE TRANSACCIONES
   */
  private async procesarTransaccion(transaccionId: string): Promise<void> {
    try {
      const transaccion = await this.transaccionModel.findById(transaccionId).exec();
      
      if (!transaccion || transaccion.estado !== EstadoTransaccion.AUTORIZADA) {
        throw new BadRequestException('Transacción no autorizada para procesamiento');
      }

      switch (transaccion.tipo) {
        case TipoTransaccion.TRANSFERENCIA:
          await this.procesarTransferencia(transaccion);
          break;
        case TipoTransaccion.DEPOSITO:
          await this.procesarDeposito(transaccion);
          break;
        case TipoTransaccion.RETIRO:
          await this.procesarRetiro(transaccion);
          break;
      }

      transaccion.estado = EstadoTransaccion.COMPLETADA;
      transaccion.fecha_procesamiento = new Date();
      await transaccion.save();

      this.logger.log(`Transacción ${transaccionId} procesada exitosamente`);

    } catch (error) {
      await this.transaccionModel.findByIdAndUpdate(transaccionId, {
        estado: EstadoTransaccion.FALLIDA,
        motivo_fallo: error.message
      });
      
      this.logger.error(`Error procesando transacción ${transaccionId}: ${error.message}`);
      throw error;
    }
  }

  private async procesarTransferencia(transaccion: Transaccion): Promise<void> {
    // Debitar cuenta origen
    await firstValueFrom(
      this.accountsClient.send('accounts.actualizarSaldo', {
        cuentaId: transaccion.cuenta_origen,
        monto: -(transaccion.monto + transaccion.comision)
      })
    );

    // Acreditar cuenta destino
    await firstValueFrom(
      this.accountsClient.send('accounts.actualizarSaldo', {
        cuentaId: transaccion.cuenta_destino,
        monto: transaccion.monto
      })
    );

    // Registrar movimientos
    await Promise.all([
      firstValueFrom(
        this.accountsClient.send('accounts.procesarMovimiento', {
          cuentaId: transaccion.cuenta_origen,
          monto: -(transaccion.monto + transaccion.comision),
          movimientoId: transaccion._id
        })
      ),
      firstValueFrom(
        this.accountsClient.send('accounts.procesarMovimiento', {
          cuentaId: transaccion.cuenta_destino,
          monto: transaccion.monto,
          movimientoId: transaccion._id
        })
      )
    ]);
  }

  private async procesarDeposito(transaccion: Transaccion): Promise<void> {
    await firstValueFrom(
      this.accountsClient.send('accounts.actualizarSaldo', {
        cuentaId: transaccion.cuenta_origen,
        monto: transaccion.monto
      })
    );

    await firstValueFrom(
      this.accountsClient.send('accounts.procesarMovimiento', {
        cuentaId: transaccion.cuenta_origen,
        monto: transaccion.monto,
        movimientoId: transaccion._id
      })
    );
  }

  private async procesarRetiro(transaccion: Transaccion): Promise<void> {
    await firstValueFrom(
      this.accountsClient.send('accounts.actualizarSaldo', {
        cuentaId: transaccion.cuenta_origen,
        monto: -(transaccion.monto + transaccion.comision)
      })
    );

    await firstValueFrom(
      this.accountsClient.send('accounts.procesarMovimiento', {
        cuentaId: transaccion.cuenta_origen,
        monto: -(transaccion.monto + transaccion.comision),
        movimientoId: transaccion._id
      })
    );
  }
}
