import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CuentaApp, PatronAutenticacion,Cuenta } from 'shared-models';
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
    @InjectModel(Cuenta.name) private cuentaModel: Model<Cuenta> // Asegúrate de que el modelo 'Cuenta' esté definido correctamente
    
  ) {}

  /**
   * Crear un nuevo patrón de autenticación
   */
 async crearPatronAutenticacion(
  idUsuario: string,
  nombre: string,
  dedosPatronIds: string[]
): Promise<PatronAutenticacion> {
  try {
    // Validar mínimo de 3 dedos patrón
    if (dedosPatronIds.length < 3) {
      throw new BadRequestException('Debe proporcionar al menos 3 dedos patrón');
    }

    // Validar existencia de usuario
    const cuentaAppUsuario = await this.cuentaAppModel.findOne({ persona: idUsuario });
    if (!cuentaAppUsuario) {
      throw new BadRequestException('El usuario no existe');
    }

    // Validar existencia de todos los dedos patrón
    const dedosExistentes = await this.dedoPatronModel
      .find({ _id: { $in: dedosPatronIds } })
      .exec();

    if (dedosExistentes.length !== dedosPatronIds.length) {
      throw new BadRequestException('Algunos dedos patrón no existen');
    }

    // Construir nuevo patrón de autenticación
    const nuevoPatron = new this.patronAutenticacionModel({
      id_patron_autenticacion: new Types.ObjectId(),
      nombre: nombre.trim(),
      fecha_creacion: new Date(),
      activo: true,
      dedos_patron: dedosPatronIds, // el orden se refleja en el índice del array
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
      // Primero obtenemos los dedos patrón de la cuenta
      const cuentaAppUsuario = await this.cuentaAppModel.findOne({persona:idUsuario});

      const dedosPatron = await this.dedoPatronModel
        .find({ id_cuenta_app: cuentaAppUsuario._id })
        .exec();

      const dedosPatronIds = dedosPatron.map(dedo => dedo._id);

      // Luego buscamos patrones que contengan esos dedos
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
  //Validacion de patron de autenticacion
async validarCompraConPatron(body: {
  cuentaId: string; // Este es el ID de la cuenta transaccional
  monto: string;
  sensorIds: string[];
}) {
  const { cuentaId, monto, sensorIds } = body;

  console.log('=== DEBUGGING VALIDACION COMPRA ===');
  console.log('CuentaId transaccional recibida:', cuentaId);
  console.log('Monto:', monto);
  console.log('SensorIds recibidos:', sensorIds);

  // PASO 1: Convertir de cuenta transaccional a cuenta app
  console.log('\n--- PASO 1: Obteniendo cuenta app ---');
  
  // Buscar la cuenta transaccional
  const cuentaTransaccional = await this.cuentaModel.findById(cuentaId);
  if (!cuentaTransaccional) {
    console.log('❌ Cuenta transaccional no encontrada');
    return {
      valid: false,
      message: 'Cuenta transaccional no encontrada.'
    };
  }

  console.log('Cuenta transaccional encontrada:', {
    id: cuentaTransaccional._id,
    numero_cuenta: cuentaTransaccional.numero_cuenta,
    titular: cuentaTransaccional.titular
  });

  // Buscar la cuenta app usando el titular
  const cuentaApp = await this.cuentaAppModel.findOne({ 
    persona: cuentaTransaccional.titular 
  });
  
  if (!cuentaApp) {
    console.log('❌ Cuenta app no encontrada para el titular');
    return {
      valid: false,
      message: 'No se encontró cuenta de aplicación para este titular.'
    };
  }

  console.log('Cuenta app encontrada:', {
    id: cuentaApp._id,
    persona: cuentaApp.persona
  });

  // PASO 2: Buscar patrones usando el ID de la cuenta app
  console.log('\n--- PASO 2: Buscando patrones ---');
  const dedosPatron = await this.dedoPatronModel
    .find({ id_cuenta_app: cuentaApp._id })
    .populate('dedos_registrados')
    .exec();

  console.log('Dedos patrón encontrados:', dedosPatron.length);

  if (!dedosPatron || dedosPatron.length === 0) {
    console.log('❌ No se encontraron patrones para esta cuenta app');
    return {
      valid: false,
      message: 'No existe un patrón registrado para esta cuenta.'
    };
  }

  // PASO 3: Mostrar información de los patrones
  console.log('\n--- PASO 3: Información de patrones ---');
  dedosPatron.forEach((dedo, index) => {
    console.log(`Dedo patrón ${index + 1}:`);
    console.log('  ID del patrón:', dedo._id);
    console.log('  Orden:', dedo.orden);
    console.log('  Tipo de dedo:', dedo.dedos_registrados?.dedo);
    console.log('  Hash almacenado:', dedo.dedos_registrados?.huella);
    
    // Verificar formato del hash
    if (dedo.dedos_registrados?.huella) {
      const parts = dedo.dedos_registrados.huella.split(':');
      console.log('  Formato hash:', parts.length === 2 ? '✅ Correcto (salt:hash)' : '❌ Incorrecto');
    }
  });

  // PASO 4: Verificar coincidencias
  console.log('\n--- PASO 4: Verificando coincidencias ---');
  let coincidencias = 0;
  const resultados = [];

  for (let i = 0; i < sensorIds.length; i++) {
    const sensorId = sensorIds[i];
    console.log(`\nVerificando sensorId ${i + 1}: ${sensorId}`);
    
    let encontrado = false;
    
    for (let j = 0; j < dedosPatron.length; j++) {
      const dedoPatron = dedosPatron[j];
      const storedHash = dedoPatron.dedos_registrados?.huella;
      
      if (storedHash && this.verifySensorId(sensorId, storedHash)) {
        console.log(`✅ Coincidencia con dedo ${dedoPatron.dedos_registrados?.dedo}`);
        coincidencias++;
        encontrado = true;
        resultados.push({
          sensorId,
          dedoTipo: dedoPatron.dedos_registrados?.dedo,
          orden: dedoPatron.orden,
          coincide: true
        });
        break;
      }
    }
    
    if (!encontrado) {
      console.log('❌ Sin coincidencia');
      resultados.push({
        sensorId,
        coincide: false
      });
    }
  }

  // PASO 5: Resultado final
  console.log('\n--- RESULTADO FINAL ---');
  console.log('Coincidencias encontradas:', coincidencias);
  console.log('Requeridas:', 3);

  if (coincidencias >= 3) {
    console.log('✅ TRANSACCIÓN AUTORIZADA');
    return {
      valid: true,
      message: 'Patrón válido. Compra autorizada.',
      coincidencias,
      cuentaTransaccional: cuentaTransaccional.numero_cuenta,
      monto,
      resultados
    };
  } else {
    console.log('❌ TRANSACCIÓN RECHAZADA');
    return {
      valid: false,
      message: `Huellas insuficientes. Se requieren al menos 3, se encontraron ${coincidencias}.`,
      coincidencias,
      resultados
    };
  }
}
private verifySensorId(sensorId: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const expectedHash = crypto.createHash('sha256')
      .update(sensorId + this.ENCRYPTION_KEY + salt)
      .digest('hex');

    return hash === expectedHash;
  } catch (error) {
    return false;
  }
}

}