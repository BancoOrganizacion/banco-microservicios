import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CuentaApp, PatronAutenticacion, Cuenta, DedoRegistrado } from 'shared-models';
import { DedoPatron } from 'shared-models';
import * as crypto from 'crypto';

@Injectable()
export class PatternService {
  readonly ENCRYPTION_KEY = process.env.FINGERPRINT_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
  constructor(
    @InjectModel(PatronAutenticacion.name)
    private readonly patronAutenticacionModel: Model<PatronAutenticacion>,
    @InjectModel(DedoPatron.name)
    private readonly dedoPatronModel: Model<DedoPatron>,
    @InjectModel(CuentaApp.name) private cuentaAppModel: Model<CuentaApp>,
    @InjectModel(Cuenta.name) private cuentaModel: Model<Cuenta>,
    @InjectModel(DedoRegistrado.name) private dedoRegistradoModel: Model<DedoRegistrado>
  ) { }

  /**
   * Crear un nuevo patrón de autenticación
   */
  async crearPatronAutenticacion(
    idUsuario: string,
    nombre: string,
    dedosPatronIds: string[]
  ): Promise<PatronAutenticacion> {
    try {
      if (dedosPatronIds.length < 3) {
        throw new BadRequestException('Debe proporcionar al menos 3 dedos patrón');
      }

      const cuentaAppUsuario = await this.cuentaAppModel.findOne({ persona: idUsuario });
      if (!cuentaAppUsuario) {
        throw new BadRequestException('El usuario no existe');
      }

      const dedosExistentes = await this.dedoPatronModel
        .find({ _id: { $in: dedosPatronIds } })
        .exec();

      if (dedosExistentes.length !== dedosPatronIds.length) {
        throw new BadRequestException('Algunos dedos patrón no existen');
      }

      const nuevoPatron = new this.patronAutenticacionModel({
        id_patron_autenticacion: new Types.ObjectId(),
        nombre: nombre.trim(),
        fecha_creacion: new Date(),
        activo: true,
        dedos_patron: dedosPatronIds,
      });

      return await nuevoPatron.save();
    } catch (error) {
      throw new BadRequestException(`Error al crear patrón de autenticación: ${error.message}`);
    }
  }

  /**
   * Obtener patrón de autenticación por ID con sus dedos patrón
   */
  async obtenerPatronPorId(patronId: string): Promise<PatronAutenticacion> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .populate({
          path: 'dedos_patron',
          populate: {
            path: 'dedos_registrados',
            model: 'DedoRegistrado'
          }
        })
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      return patron;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener patrón: ${error.message}`);
    }
  }

  /**
   * Obtener dedos patrón de un patrón específico
   */
  async obtenerDedosPatron(patronId: string): Promise<DedoPatron[]> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .populate('dedos_patron')
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      if (!patron.activo) {
        throw new BadRequestException('El patrón de autenticación está inactivo');
      }

      return patron.dedos_patron as DedoPatron[];
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener dedos patrón: ${error.message}`);
    }
  }

  /**
   * Obtener patrones activos por cuenta de aplicación
   */
  async obtenerPatronesPorCuenta(idUsuario: string): Promise<PatronAutenticacion[]> {
    try {
      const cuentaAppUsuario = await this.cuentaAppModel.findOne({ persona: idUsuario });

      const dedosPatron = await this.dedoPatronModel
        .find({ id_cuenta_app: cuentaAppUsuario._id })
        .exec();

      const dedosPatronIds = dedosPatron.map(dedo => dedo._id);

      const patrones = await this.patronAutenticacionModel
        .find({
          activo: true,
          dedos_patron: { $in: dedosPatronIds }
        })
        .populate('dedos_patron')
        .exec();

      return patrones;
    } catch (error) {
      throw new BadRequestException(`Error al obtener patrones: ${error.message}`);
    }
  }

  /**
   * Activar/Desactivar patrón de autenticación
   */
  async cambiarEstadoPatron(patronId: string, activo: boolean): Promise<PatronAutenticacion> {
    try {
      const patron = await this.patronAutenticacionModel
        .findByIdAndUpdate(
          patronId,
          { activo },
          { new: true }
        )
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      return patron;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al cambiar estado del patrón: ${error.message}`);
    }
  }

  /**
   * Validar si un patrón está activo y disponible para autenticación
   */
  async validarPatronParaAutenticacion(patronId: string): Promise<boolean> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .exec();

      return patron && patron.activo;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener información completa del patrón para autenticación
   */
  async obtenerPatronParaAutenticacion(patronId: string): Promise<{
    patron: PatronAutenticacion;
    dedosPatron: DedoPatron[];
  }> {
    try {
      const patron = await this.obtenerPatronPorId(patronId);

      if (!patron.activo) {
        throw new BadRequestException('El patrón de autenticación está inactivo');
      }

      const dedosPatron = await this.obtenerDedosPatron(patronId);

      return {
        patron,
        dedosPatron
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener información básica del patrón
   */
  async obtenerPatronBasico(patronId: string): Promise<{
    _id: string;
    nombre: string;
    fecha_creacion: Date;
    activo: boolean;
    cantidadDedos: number;
  }> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .select('nombre fecha_creacion activo dedos_patron')
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      return {
        _id: patron._id.toString(),
        nombre: patron.nombre,
        fecha_creacion: patron.fecha_creacion,
        activo: patron.activo,
        cantidadDedos: patron.dedos_patron ? patron.dedos_patron.length : 0
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener información del patrón: ${error.message}`);
    }
  }

  /**
   * Validación de compra con patrón - Versión con restricciones por monto
   */
  async validarCompraConPatron(body: {
    cuentaId: string;
    monto: string;
    sensorIds: string[];
  }) {
    const { cuentaId, monto, sensorIds } = body;
    const montoNumerico = parseFloat(monto);

    // Paso 1: Obtener cuenta transaccional CON RESTRICCIONES
    const cuentaTransaccional = await this.cuentaModel.findById(cuentaId);
    if (!cuentaTransaccional) {
      return { valid: false, message: 'Cuenta no encontrada.' };
    }

    // Paso 2: VALIDAR RESTRICCIONES POR MONTO
    const restricciones = cuentaTransaccional.restricciones || [];

    const restriccionAplicable = restricciones.find(r =>
      montoNumerico >= r.monto_desde && montoNumerico <= r.monto_hasta
    );

    if (!restriccionAplicable) {
      return {
        valid: true,
        message: 'Transacción válida - Sin restricción de autenticación para este monto.',
        requiere_autenticacion: false,
        monto_validado: montoNumerico
      };
    }

    if (!restriccionAplicable.patron_autenticacion) {
      return {
        valid: true,
        message: 'Transacción válida - Restricción encontrada pero sin patrón específico requerido.',
        requiere_autenticacion: false,
        restriccion_aplicada: {
          monto_desde: restriccionAplicable.monto_desde,
          monto_hasta: restriccionAplicable.monto_hasta
        }
      };
    }

    // Paso 3: Obtener cuenta app del titular
    const cuentaApp = await this.cuentaAppModel.findOne({
      persona: cuentaTransaccional.titular
    });
    if (!cuentaApp) {
      return { valid: false, message: 'Cuenta de aplicación no encontrada.' };
    }

    // Paso 4: VALIDAR EL PATRÓN ESPECÍFICO REQUERIDO
    const patronRequerido = await this.patronAutenticacionModel
      .findById(restriccionAplicable.patron_autenticacion)
      .populate('dedos_patron')
      .exec();

    if (!patronRequerido) {
      return {
        valid: false,
        message: 'Patrón de autenticación requerido no encontrado.'
      };
    }

    if (!patronRequerido.activo) {
      return {
        valid: false,
        message: 'Patrón de autenticación requerido está inactivo.'
      };
    }

    // Paso 5: Obtener SOLO los dedos que están en el patrón específico
    const dedosPatronEspecificos = await this.dedoPatronModel
      .find({
        _id: { $in: patronRequerido.dedos_patron },
        id_cuenta_app: cuentaApp._id
      })
      .populate('dedos_registrados')
      .exec();

    if (dedosPatronEspecificos.length === 0) {
      return {
        valid: false,
        message: 'No se encontraron dedos válidos para el patrón requerido.'
      };
    }

    // Paso 6: VALIDAR SOLO CONTRA EL PATRÓN ESPECÍFICO
    let coincidencias = 0;
    const detallesValidacion = [];

    for (let i = 0; i < sensorIds.length; i++) {
      const sensorId = sensorIds[i];
      let encontrado = false;

      for (let j = 0; j < dedosPatronEspecificos.length; j++) {
        const dedoPatron = dedosPatronEspecificos[j];
        const storedHash = dedoPatron.dedos_registrados?.huella;

        if (storedHash && this.verifySensorId(sensorId, storedHash)) {
          coincidencias++;
          encontrado = true;

          detallesValidacion.push({
            sensorId,
            dedo: dedoPatron.dedos_registrados.dedo,
            orden: dedoPatron.orden,
            patron_id: patronRequerido._id,
            valido: true
          });
          break;
        }
      }

      if (!encontrado) {
        detallesValidacion.push({
          sensorId,
          valido: false
        });
      }
    }

    // Paso 7: EVALUAR RESULTADO SEGÚN PATRÓN ESPECÍFICO
    const minimoRequerido = Math.min(3, dedosPatronEspecificos.length);
    const esValido = coincidencias >= minimoRequerido;

    return {
      valid: esValido,
      message: esValido
        ? `Patrón válido. Compra autorizada con patrón "${patronRequerido.nombre}".`
        : `Autenticación fallida. Se encontraron ${coincidencias}/${minimoRequerido} huellas válidas del patrón requerido.`,
      requiere_autenticacion: true,
      monto_validado: montoNumerico,
      restriccion_aplicada: {
        monto_desde: restriccionAplicable.monto_desde,
        monto_hasta: restriccionAplicable.monto_hasta,
        patron_requerido: patronRequerido.nombre,
        patron_id: patronRequerido._id
      },
      validacion_resultado: {
        coincidencias,
        total_enviadas: sensorIds.length,
        minimo_requerido: minimoRequerido,
        dedos_en_patron: dedosPatronEspecificos.length,
        detalles: detallesValidacion
      }
    };
  }

  /**
   * Validar patrón con sensor IDs específicos
   */
async validarPatronConSensorIds(patronId: string, sensorIds: string[]) {
  try {
    const patron = await this.patronAutenticacionModel
      .findById(patronId)
      .populate({
        path: 'dedos_patron',
        populate: {
          path: 'dedos_registrados',
          model: 'DedoRegistrado'
        }
      })
      .exec();

    if (!patron || !patron.activo) {
      return { 
        valid: false, 
        message: 'Patrón de autenticación no encontrado o inactivo.' 
      };
    }

    // ✅ CRUCIAL: Ordenar por campo 'orden' para tener secuencia correcta
    const dedosOrdenados = patron.dedos_patron.sort((a, b) => a.orden - b.orden);

    console.log('🔍 VALIDACIÓN POSICIÓN POR POSICIÓN');
    console.log('Array registrado:', dedosOrdenados.map(d => d.dedos_registrados?.dedo));
    console.log('Array recibido: count =', sensorIds.length);

    // ✅ VALIDAR que coincida la cantidad
    if (sensorIds.length !== dedosOrdenados.length) {
      return {
        valid: false,
        message: `Cantidad incorrecta. Esperado: ${dedosOrdenados.length}, Recibido: ${sensorIds.length}`,
      };
    }

    let coincidenciasCorrectas = 0;
    const detallesValidacion = [];

    // ✅ COMPARACIÓN DIRECTA: posición[i] vs posición[i]
    for (let i = 0; i < sensorIds.length; i++) {
      const sensorIdRecibido = sensorIds[i];           // Lo que envía el usuario
      const dedoEsperado = dedosOrdenados[i];          // Lo que está en BD en esa posición
      
      console.log(`\n--- Posición ${i} ---`);
      console.log(`Recibido: SensorId en posición ${i}`);
      console.log(`Esperado: ${dedoEsperado.dedos_registrados?.dedo} (orden ${dedoEsperado.orden})`);

      if (!dedoEsperado.dedos_registrados?.huella) {
        console.log(`❌ Sin huella registrada en posición ${i}`);
        detallesValidacion.push({
          posicion: i,
          esperado: dedoEsperado.dedos_registrados?.dedo,
          orden: dedoEsperado.orden,
          valido: false,
          razon: 'Sin huella registrada'
        });
        continue;
      }

      // ✅ VERIFICAR: huella en posición[i] == huella esperada en posición[i]
      const hashAlmacenado = dedoEsperado.dedos_registrados.huella;
      const coincideEnPosicion = this.verifySensorId(sensorIdRecibido, hashAlmacenado);

      if (coincideEnPosicion) {
        coincidenciasCorrectas++;
        console.log(`✅ MATCH en posición ${i}: ${dedoEsperado.dedos_registrados.dedo}`);
      } else {
        console.log(`❌ NO MATCH en posición ${i}`);
      }

      detallesValidacion.push({
        posicion: i,
        esperado: dedoEsperado.dedos_registrados.dedo,
        orden: dedoEsperado.orden,
        valido: coincideEnPosicion,
        razon: coincideEnPosicion ? 'Válido en posición correcta' : 'Huella no coincide en esta posición'
      });
    }

    
    const esValido = coincidenciasCorrectas === sensorIds.length;

    return {
      valid: esValido,
      message: esValido 
        ? 'Patrón válido con orden correcto. Transacción autorizada.'
        : `Patrón incorrecto ${coincidenciasCorrectas}/${sensorIds.length} posiciones correctas, Se requiere coincidencia total`,
      coincidenciasCorrectas,
      totalPosiciones: sensorIds.length,
    
      detalles: detallesValidacion
    };

  } catch (error) {
    console.error('Error en validación:', error);
    return {
      valid: false,
      message: `Error en validación: ${error.message}`
    };
  }
}


  /**
   * Verificar ID del sensor contra hash almacenado
   */
  private verifySensorId(sensorId: string, storedHash: string): boolean {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 2) {
        return false;
      }

      const [salt, expectedHash] = parts;
      const dataToHash = sensorId + this.ENCRYPTION_KEY + salt;

      const calculatedHash = crypto.createHash('sha256')
        .update(dataToHash)
        .digest('hex');

      return calculatedHash === expectedHash;
    } catch (error) {
      return false;
    }
  }
}