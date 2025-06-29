import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CuentaApp, PatronAutenticacion, Cuenta } from 'shared-models';
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
      const cuentaAppUsuario = await this.cuentaAppModel.findOne({ persona: idUsuario });

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
  // Método mejorado que maneja la conversión de cuenta transaccional a cuenta app// Método mejorado que maneja la conversión de cuenta transaccional a cuenta app
// Método mejorado que maneja la conversión de cuenta transaccional a cuenta app
async validarCompraConPatron(body: {
  cuentaId: string; // ID de cuenta transaccional
  monto: string;
  sensorIds: string[];
}) {
  const { cuentaId, monto, sensorIds } = body;

  // PRIMERO: Mostrar todos los hashes almacenados
  await this.mostrarHashesAlmacenados(cuentaId);

  console.log('\n=== VALIDACION DE COMPRA - HASH DEBUG ===');
  console.log('CuentaId (transaccional):', cuentaId);
  console.log('SensorIds recibidos:', sensorIds);
  console.log('ENCRYPTION_KEY:', this.ENCRYPTION_KEY);

  // Mostrar hashes almacenados primero
  await this.mostrarHashesAlmacenados(cuentaId);

  // Paso 1: Obtener titular de la cuenta transaccional
  const cuentaTransaccional = await this.cuentaModel.findById(cuentaId);
  if (!cuentaTransaccional) {
    return { valid: false, message: 'Cuenta no encontrada.' };
  }

  console.log('Titular de la cuenta:', cuentaTransaccional.titular);

  // Paso 2: Obtener cuenta app del titular
  const cuentaApp = await this.cuentaAppModel.findOne({ 
    persona: cuentaTransaccional.titular 
  });
  if (!cuentaApp) {
    return { valid: false, message: 'Cuenta de aplicación no encontrada.' };
  }

  console.log('ID de cuenta app:', cuentaApp._id);

  // Paso 3: Obtener patrones
  const dedosPatron = await this.dedoPatronModel
    .find({ id_cuenta_app: cuentaApp._id })
    .populate('dedos_registrados')
    .exec();

  console.log('\n=== PATRONES ENCONTRADOS ===');
  console.log('Total patrones:', dedosPatron.length);

  if (dedosPatron.length === 0) {
    return { valid: false, message: 'No hay patrones registrados.' };
  }

  // Mostrar todos los hashes almacenados
  dedosPatron.forEach((patron, index) => {
    console.log(`\nPatrón ${index + 1}:`);
    console.log('  Dedo:', patron.dedos_registrados?.dedo);
    console.log('  Hash completo:', patron.dedos_registrados?.huella);
    
    if (patron.dedos_registrados?.huella) {
      const [salt, hash] = patron.dedos_registrados.huella.split(':');
      console.log('  Salt:', salt);
      console.log('  Hash:', hash);
      console.log('  Formato válido:', !!(salt && hash));
    }
  });

  console.log('\n=== VERIFICACION DE CADA SENSORID ===');
  let coincidencias = 0;

  for (let i = 0; i < sensorIds.length; i++) {
    const sensorId = sensorIds[i];
    console.log(`\n--- SensorId ${i + 1}: "${sensorId}" ---`);
    
    let encontrado = false;
    
    for (let j = 0; j < dedosPatron.length; j++) {
      const patron = dedosPatron[j];
      const storedHash = patron.dedos_registrados?.huella;
      
      console.log(`  Comparando con patrón ${j + 1} (${patron.dedos_registrados?.dedo}):`);
      
      if (storedHash) {
        const resultado = this.debugVerifySensorId(sensorId, storedHash);
        if (resultado.isValid) {
          console.log('  ✅ MATCH ENCONTRADO!');
          coincidencias++;
          encontrado = true;
          break;
        } else {
          console.log('  ❌ No coincide');
        }
      } else {
        console.log('  ❌ Hash vacío');
      }
    }
    
    if (!encontrado) {
      console.log(`  ❌ SensorId "${sensorId}" no coincide con ningún patrón`);
    }
  }

  console.log(`\n=== RESULTADO FINAL ===`);
  console.log(`Coincidencias: ${coincidencias} / ${sensorIds.length}`);
  console.log(`Requeridas: 3`);

  const esValido = coincidencias >= 3;
  console.log(`Resultado: ${esValido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);

  return {
    valid: esValido,
    message: esValido 
      ? 'Patrón válido. Compra autorizada.'
      : `Huellas insuficientes. Se encontraron ${coincidencias}/3.`,
    coincidencias,
    total: sensorIds.length
  };
}

// Método especializado para debugging de hash
private debugVerifySensorId(sensorId: string, storedHash: string): { isValid: boolean, details: any } {
  console.log(`    🔍 DEBUG HASH para sensorId: "${sensorId}"`);
  console.log(`    StoredHash: "${storedHash}"`);
  
  try {
    // Verificar formato
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      console.log(`    ❌ Formato incorrecto. Partes: ${parts.length}, Esperadas: 2`);
      return { isValid: false, details: { error: 'Formato incorrecto', parts } };
    }

    const [salt, expectedHash] = parts;
    console.log(`    Salt: "${salt}" (length: ${salt.length})`);
    console.log(`    Hash esperado: "${expectedHash}" (length: ${expectedHash.length})`);

    // Crear el string a hashear
    const dataToHash = sensorId + this.ENCRYPTION_KEY + salt;
    console.log(`    Datos a hashear: "${dataToHash}"`);
    console.log(`    Breakdown:`);
    console.log(`      - sensorId: "${sensorId}"`);
    console.log(`      - ENCRYPTION_KEY: "${this.ENCRYPTION_KEY}"`);
    console.log(`      - salt: "${salt}"`);

    // Calcular hash
    const calculatedHash = crypto.createHash('sha256')
      .update(dataToHash)
      .digest('hex');

    console.log(`    Hash calculado: "${calculatedHash}"`);
    console.log(`    Hash esperado:  "${expectedHash}"`);
    
    const isMatch = calculatedHash === expectedHash;
    console.log(`    ¿Coinciden? ${isMatch ? '✅ SÍ' : '❌ NO'}`);

    if (!isMatch) {
      // Encontrar primera diferencia
      const minLength = Math.min(calculatedHash.length, expectedHash.length);
      for (let i = 0; i < minLength; i++) {
        if (calculatedHash[i] !== expectedHash[i]) {
          console.log(`    Primera diferencia en posición ${i}:`);
          console.log(`      Calculado: '${calculatedHash[i]}'`);
          console.log(`      Esperado:  '${expectedHash[i]}'`);
          break;
        }
      }
    }

    return {
      isValid: isMatch,
      details: {
        sensorId,
        salt,
        expectedHash,
        calculatedHash,
        dataToHash,
        encryptionKey: this.ENCRYPTION_KEY
      }
    };

  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return { isValid: false, details: { error: error.message } };
  }
}
// Método simple para ver todos los hashes almacenados
async mostrarHashesAlmacenados(cuentaId: string) {
  console.log('=== HASHES ALMACENADOS ===');
  
  const cuentaTransaccional = await this.cuentaModel.findById(cuentaId);
  if (!cuentaTransaccional) {
    console.log('❌ Cuenta no encontrada');
    return;
  }

  const cuentaApp = await this.cuentaAppModel.findOne({ 
    persona: cuentaTransaccional.titular 
  });
  if (!cuentaApp) {
    console.log('❌ Cuenta app no encontrada');
    return;
  }

  const patrones = await this.dedoPatronModel
    .find({ id_cuenta_app: cuentaApp._id })
    .populate('dedos_registrados')
    .exec();

  console.log(`Total patrones: ${patrones.length}`);
  
  patrones.forEach((patron, index) => {
    console.log(`\nPatrón ${index + 1}:`);
    console.log(`  Dedo: ${patron.dedos_registrados?.dedo}`);
    console.log(`  Hash: ${patron.dedos_registrados?.huella}`);
    
    // Descomponer el hash
    if (patron.dedos_registrados?.huella) {
      const parts = patron.dedos_registrados.huella.split(':');
      if (parts.length === 2) {
        console.log(`  Salt: ${parts[0]}`);
        console.log(`  Hash: ${parts[1]}`);
      } else {
        console.log(`  ❌ Formato incorrecto: ${parts.length} partes`);
      }
    }
  });
}
// Método especializado para debugging de hash


  // Método auxiliar para debuggear qué patrones existen en la base de datos
  async debugPatterns(personaId?: string) {
    console.log('=== DEBUG: VERIFICANDO TODOS LOS PATRONES ===');

    // Obtener todos los patrones
    const todosLosPatrones = await this.dedoPatronModel
      .find({})
      .populate('dedos_registrados')
      .populate('id_cuenta_app')
      .exec();

    console.log('Total de patrones en la BD:', todosLosPatrones.length);

    todosLosPatrones.forEach((patron, index) => {
      console.log(`\nPatrón ${index + 1}:`);
      console.log('  ID del patrón:', patron._id);
      console.log('  id_cuenta_app:', patron.id_cuenta_app);
      console.log('  Orden:', patron.orden);
      console.log('  Dedo registrado:', {
        id: patron.dedos_registrados?._id,
        dedo: patron.dedos_registrados?.dedo,
        huella: patron.dedos_registrados?.huella?.substring(0, 20) + '...'
      });
    });

    if (personaId) {
      console.log('\n--- FILTRADO POR PERSONA ---');
      console.log('Buscando persona:', personaId);

      // Buscar cuenta app de esta persona
      const cuentaApp = await this.cuentaAppModel.findOne({ persona: personaId });
      if (cuentaApp) {
        console.log('Cuenta app encontrada:', cuentaApp._id);

        const patronesDePersona = todosLosPatrones.filter(p =>
          p.id_cuenta_app && p.id_cuenta_app.toString() === cuentaApp._id.toString()
        );

        console.log('Patrones de esta persona:', patronesDePersona.length);
        patronesDePersona.forEach((patron, index) => {
          console.log(`  Patrón ${index + 1}: ${patron.dedos_registrados?.dedo} - ${patron.orden}`);
        });
      } else {
        console.log('❌ No se encontró cuenta app para esta persona');
      }
    }

    return todosLosPatrones;
  }

  // También añadir este método para verificar todas las cuentas
  async debugAccounts() {
    console.log('\n=== DEBUG: VERIFICANDO CUENTAS ===');

    const cuentasApp = await this.cuentaAppModel.find({});
    console.log('Total cuentas app:', cuentasApp.length);

    cuentasApp.forEach((cuenta, index) => {
      console.log(`Cuenta app ${index + 1}:`);
      console.log('  ID:', cuenta._id);
      console.log('  Usuario:', cuenta.nombre_usuario);
      console.log('  Persona:', cuenta.persona);
    });

    const cuentasTransaccionales = await this.cuentaModel.find({});
    console.log('\nTotal cuentas transaccionales:', cuentasTransaccionales.length);

    cuentasTransaccionales.forEach((cuenta, index) => {
      console.log(`Cuenta transaccional ${index + 1}:`);
      console.log('  ID:', cuenta._id);
      console.log('  Número:', cuenta.numero_cuenta);
      console.log('  Titular:', cuenta.titular);
    });
  }
  async validarRestriccionesYPatrones(body: {
  cuentaId: string;
  monto: string;
  sensorIds: string[];
}) {
  const { cuentaId, monto, sensorIds } = body;
  const montoNumerico = parseFloat(monto);

  console.log('\n=== VALIDACIÓN DE RESTRICCIONES Y PATRONES ===');
  console.log('CuentaId:', cuentaId);
  console.log('Monto:', montoNumerico);
  console.log('SensorIds recibidos:', sensorIds);

  // Paso 1: Obtener cuenta transaccional
  const cuentaTransaccional = await this.cuentaModel.findById(cuentaId);
  if (!cuentaTransaccional) {
    return { valid: false, message: 'Cuenta no encontrada.' };
  }

  // Paso 2: Obtener restricciones de la cuenta
  // AQUÍ ESTÁ EL PROBLEMA: El servicio de patterns NO tiene acceso a las restricciones
  // Las restricciones están en accounts-service, no en patterns-service
  
  // SOLUCIÓN: Necesitas hacer una llamada al microservicio de cuentas
  // O mover esta lógica al accounts-service
  
  // Por ahora, simulo que obtienes las restricciones:
  const restricciones = cuentaTransaccional.restricciones || [];
  
  // Paso 3: Buscar restricción aplicable
  const restriccionAplicable = restricciones.find(r => 
    montoNumerico >= r.monto_desde && montoNumerico <= r.monto_hasta
  );

  if (!restriccionAplicable) {
    // Si no hay restricción, la transacción es válida sin autenticación
    return { 
      valid: true, 
      message: 'Transacción válida sin autenticación requerida.',
      requiere_autenticacion: false
    };
  }

  if (!restriccionAplicable.patron_autenticacion) {
    return { 
      valid: true, 
      message: 'Restricción encontrada pero sin patrón requerido.',
      requiere_autenticacion: false
    };
  }

  // Paso 4: Validar el patrón de autenticación
  console.log('Patrón requerido:', restriccionAplicable.patron_autenticacion);
  
  return await this.validarPatronConSensorIds(
    restriccionAplicable.patron_autenticacion.toString(),
    sensorIds
  );
}

// 2. NUEVO MÉTODO PARA VALIDAR PATRÓN CON SENSOR IDS
async validarPatronConSensorIds(patronId: string, sensorIds: string[]) {
  try {
    console.log('\n=== VALIDANDO PATRÓN CON SENSOR IDS ===');
    console.log('PatronId:', patronId);
    console.log('SensorIds a validar:', sensorIds);

    // Obtener el patrón de autenticación
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

    console.log('Patrón encontrado:', patron.nombre);
    console.log('Dedos en el patrón:', patron.dedos_patron.length);

    // Validar cada sensorId recibido
    let coincidencias = 0;
    const detallesValidacion = [];

    for (const sensorId of sensorIds) {
      console.log(`\n--- Validando sensorId: "${sensorId}" ---`);
      
      let encontrado = false;
      
      for (const dedoPatron of patron.dedos_patron) {
        if (dedoPatron.dedos_registrados && dedoPatron.dedos_registrados.huella) {
          const hashAlmacenado = dedoPatron.dedos_registrados.huella;
          
          if (this.verifySensorId(sensorId, hashAlmacenado)) {
            console.log(`✅ SensorId "${sensorId}" coincide con dedo ${dedoPatron.dedos_registrados.dedo}`);
            coincidencias++;
            encontrado = true;
            
            detallesValidacion.push({
              sensorId,
              dedo: dedoPatron.dedos_registrados.dedo,
              orden: dedoPatron.orden,
              valido: true
            });
            break;
          }
        }
      }
      
      if (!encontrado) {
        console.log(`❌ SensorId "${sensorId}" no coincide con ningún patrón`);
        detallesValidacion.push({
          sensorId,
          valido: false
        });
      }
    }

    // Definir cuántas coincidencias se requieren (puedes ajustar esto)
    const coincidenciasRequeridas = Math.min(3, patron.dedos_patron.length);
    const esValido = coincidencias >= coincidenciasRequeridas;

    console.log(`\n=== RESULTADO ===`);
    console.log(`Coincidencias: ${coincidencias}/${sensorIds.length}`);
    console.log(`Requeridas: ${coincidenciasRequeridas}`);
    console.log(`Resultado: ${esValido ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);

    return {
      valid: esValido,
      message: esValido 
        ? 'Patrón válido. Transacción autorizada.'
        : `Huellas insuficientes. Se encontraron ${coincidencias}/${coincidenciasRequeridas} requeridas.`,
      coincidencias,
      total: sensorIds.length,
      requeridas: coincidenciasRequeridas,
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

// 3. CORRECCIÓN DEL MÉTODO verifySensorId
private verifySensorId(sensorId: string, storedHash: string): boolean {
  try {
    console.log(`    🔍 Verificando sensorId: "${sensorId}"`);
    console.log(`    Hash almacenado: "${storedHash}"`);
    
    const parts = storedHash.split(':');
    if (parts.length !== 2) {
      console.log(`    ❌ Formato de hash incorrecto`);
      return false;
    }

    const [salt, expectedHash] = parts;
    
    // CORRECCIÓN: Asegurar que el string sea exactamente igual al usado en el registro
    const dataToHash = sensorId + this.ENCRYPTION_KEY + salt;
    
    const calculatedHash = crypto.createHash('sha256')
      .update(dataToHash)
      .digest('hex');

    const isMatch = calculatedHash === expectedHash;
    
    console.log(`    Salt: "${salt}"`);
    console.log(`    Hash esperado: "${expectedHash}"`);
    console.log(`    Hash calculado: "${calculatedHash}"`);
    console.log(`    ¿Coincide? ${isMatch ? '✅ SÍ' : '❌ NO'}`);

    return isMatch;
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return false;
  }
}

// 4. MÉTODO PARA DEBUGGING (temporal)
async debugPatronesUsuario(cuentaId: string) {
  console.log('\n=== DEBUG: PATRONES DEL USUARIO ===');
  
  const cuentaTransaccional = await this.cuentaModel.findById(cuentaId);
  if (!cuentaTransaccional) {
    console.log('❌ Cuenta transaccional no encontrada');
    return;
  }

  const cuentaApp = await this.cuentaAppModel.findOne({ 
    persona: cuentaTransaccional.titular 
  });
  if (!cuentaApp) {
    console.log('❌ Cuenta app no encontrada');
    return;
  }

  console.log('Titular:', cuentaTransaccional.titular);
  console.log('Cuenta app ID:', cuentaApp._id);

  // Buscar dedos patrón
  const dedosPatron = await this.dedoPatronModel
    .find({ id_cuenta_app: cuentaApp._id })
    .populate('dedos_registrados')
    .exec();

  console.log(`Total dedos patrón: ${dedosPatron.length}`);
  
  dedosPatron.forEach((dedo, index) => {
    console.log(`\nDedo ${index + 1}:`);
    console.log(`  ID: ${dedo._id}`);
    console.log(`  Dedo: ${dedo.dedos_registrados?.dedo}`);
    console.log(`  Hash: ${dedo.dedos_registrados?.huella?.substring(0, 30)}...`);
    console.log(`  Orden: ${dedo.orden}`);
  });

  // Buscar patrones de autenticación que usen estos dedos
  const dedosIds = dedosPatron.map(d => d._id);
  const patrones = await this.patronAutenticacionModel
    .find({ dedos_patron: { $in: dedosIds } })
    .exec();

  console.log(`\nPatrones de autenticación: ${patrones.length}`);
  patrones.forEach((patron, index) => {
    console.log(`\nPatrón ${index + 1}:`);
    console.log(`  ID: ${patron._id}`);
    console.log(`  Nombre: ${patron.nombre}`);
    console.log(`  Activo: ${patron.activo}`);
    console.log(`  Dedos en patrón: ${patron.dedos_patron.length}`);
  });
}
}