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
   * Obtiene información de una cuenta desde el microservicio de cuentas por número de cuenta
   */
  private async obtenerCuentaPorNumero(numeroCuenta: string): Promise<any> {
    try {
      this.logger.debug(`Buscando cuenta con número: ${numeroCuenta}`);
      return await firstValueFrom(
        this.accountsClient.send('accounts.findByNumeroCuenta', numeroCuenta)
      );
    } catch (error) {
      this.logger.error(`Error al buscar cuenta ${numeroCuenta}: ${error.message}`);
      throw new NotFoundException(`Cuenta con número ${numeroCuenta} no encontrada`);
    }
  }

  /**
   * Obtiene información de una cuenta por ID (para uso interno)
   */
  private async obtenerCuentaPorId(cuentaId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.accountsClient.send('accounts.findById', cuentaId)
      );
    } catch (error) {
      throw new NotFoundException(`Cuenta con ID ${cuentaId} no encontrada`);
    }
  }

  /**
   * TRANSFERENCIAS
   */
  async transferir(transferirDto: TransferirDto, usuarioId: string): Promise<Transaccion> {
    this.logger.debug(`Iniciando transferencia: ${JSON.stringify(transferirDto)}`);

    if (transferirDto.numero_cuenta_origen === transferirDto.numero_cuenta_destino) {
      throw new BadRequestException('La cuenta origen y destino no pueden ser la misma');
    }

    // Buscar cuentas por número de cuenta
    const cuentaOrigen = await this.obtenerCuentaPorNumero(transferirDto.numero_cuenta_origen);
    const cuentaDestino = await this.obtenerCuentaPorNumero(transferirDto.numero_cuenta_destino);

    // Verificar que el usuario es propietario de la cuenta origen
    if (cuentaOrigen.titular.toString() !== usuarioId) {
      throw new BadRequestException('No tienes permiso para usar esta cuenta origen');
    }

    // Sin comisión - solo verificar el monto solicitado
    if (cuentaOrigen.monto_actual < transferirDto.monto) {
      throw new BadRequestException('Saldo insuficiente para realizar la transferencia');
    }

    const restriccionesValidas = await this.verificarRestricciones(
      cuentaOrigen._id.toString(), 
      transferirDto.monto
    );

    const numeroTransaccion = await this.generarNumeroTransaccion();
    
    const nuevaTransaccion = new this.transaccionModel({
      numero_transaccion: numeroTransaccion,
      tipo: TipoTransaccion.TRANSFERENCIA,
      monto: transferirDto.monto,
      cuenta_origen: cuentaOrigen._id, // Guardamos el ObjectId internamente
      cuenta_destino: cuentaDestino._id, // Guardamos el ObjectId internamente
      descripcion: transferirDto.descripcion || 'Transferencia entre cuentas',
      estado: restriccionesValidas.requiere_autenticacion ? 
        EstadoTransaccion.PENDIENTE : EstadoTransaccion.AUTORIZADA,
      usuario_ejecutor: usuarioId,
      requiere_autenticacion: restriccionesValidas.requiere_autenticacion,
    });

    const transaccionGuardada = await nuevaTransaccion.save();

    // Si no requiere autenticación, procesar inmediatamente
    if (!restriccionesValidas.requiere_autenticacion) {
      await this.procesarTransaccion(transaccionGuardada._id.toString());
    }

    return transaccionGuardada;
  }

  /**
   * VALIDACIÓN Y AUTORIZACIÓN
   */
  async validarTransaccion(validarDto: ValidarTransaccionDto): Promise<any> {
    this.logger.debug(`Validando transacción: ${JSON.stringify(validarDto)}`);

    const cuentaOrigen = await this.obtenerCuentaPorNumero(validarDto.numero_cuenta_origen);

    const validaciones = {
      saldo_suficiente: cuentaOrigen.monto_actual >= validarDto.monto,
      cuenta_activa: cuentaOrigen.estado === 'ACTIVA',
      monto_valido: validarDto.monto > 0,
      monto_total: validarDto.monto // Monto total igual al monto solicitado
    };

    const restricciones = await this.verificarRestricciones(
      cuentaOrigen._id.toString(),
      validarDto.monto
    );

    if (validarDto.numero_cuenta_destino) {
      const cuentaDestino = await this.obtenerCuentaPorNumero(validarDto.numero_cuenta_destino);
      validaciones['cuenta_destino_activa'] = cuentaDestino.estado === 'ACTIVA';
    }

    return {
      es_valida: Object.values(validaciones).every(v => v === true),
      validaciones,
      restricciones,
      requiere_autenticacion: restricciones.requiere_autenticacion
    };
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
        .exec(),
      this.transaccionModel.countDocuments(filtros)
    ]);

    // Enriquecer las transacciones con información de las cuentas
    const transaccionesEnriquecidas = await Promise.all(
      transacciones.map(async (transaccion) => {
        const cuentaOrigen = await this.obtenerCuentaPorId(transaccion.cuenta_origen.toString());
        const cuentaDestino = transaccion.cuenta_destino ? 
          await this.obtenerCuentaPorId(transaccion.cuenta_destino.toString()) : null;

        return {
          ...transaccion.toObject(),
          cuenta_origen_numero: cuentaOrigen.numero_cuenta,
          cuenta_destino_numero: cuentaDestino?.numero_cuenta || null
        };
      })
    );

    return {
      transacciones: transaccionesEnriquecidas,
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
    const cuenta = await this.obtenerCuentaPorId(cuentaId);
    const movimientos = await this.obtenerMovimientosCuenta(cuentaId);

    return {
      cuenta_id: cuentaId,
      numero_cuenta: cuenta.numero_cuenta,
      saldo_actual: cuenta.monto_actual,
      fecha_ultimo_movimiento: cuenta.fecha_ultimo_movimiento,
      ultimos_movimientos: movimientos.slice(0, 5)
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
    await firstValueFrom(
      this.accountsClient.send('accounts.actualizarSaldo', {
        cuentaId: transaccion.cuenta_origen,
        monto: -transaccion.monto // Solo el monto
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
          monto: -transaccion.monto, 
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
}