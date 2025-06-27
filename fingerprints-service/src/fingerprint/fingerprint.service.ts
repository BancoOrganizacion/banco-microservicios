import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DedoRegistrado, Dedos } from 'shared-models';
import { DedoPatron } from 'shared-models';
import { CreateFingerpatternDto } from 'shared-models';
import { CuentaApp } from 'shared-models';
import * as crypto from 'crypto';

@Injectable()
export class FingerprintService {
  // Clave secreta para ofuscación (debería estar en variables de entorno)
  private readonly ENCRYPTION_KEY = process.env.FINGERPRINT_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';

  constructor(
    @InjectModel(DedoRegistrado.name) private dedoRegistradoModel: Model<DedoRegistrado>,
    @InjectModel(DedoPatron.name) private dedoPatronModel: Model<DedoPatron>,
    @InjectModel(CuentaApp.name) private cuentaAppModel: Model<CuentaApp>
  ) { }

  /**
   * Ofusca un ID del sensor de huellas de forma reversible
   */
  private obfuscateSensorId(sensorId: string): string {
    const salt = crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('sha256')
      .update(sensorId + this.ENCRYPTION_KEY + salt)
      .digest('hex');

    return `${salt}:${hash}`;
  }

  /**
   * Verifica si un ID del sensor coincide con el hash almacenado
   */
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

  /**
   * Desobfusca un ID del sensor para recuperar el valor original
   */
  private deobfuscateSensorId(obfuscatedId: string, userId: string): string {
    try {
      // Remover padding (primeros y últimos 8 caracteres)
      const encoded = obfuscatedId.substring(8, obfuscatedId.length - 8);

      // Decodificar Base64
      const combined = Buffer.from(encoded, 'base64').toString('utf8');

      // Separar componentes
      const [sensorId, userKey, timestamp] = combined.split('|');

      // Verificar que la clave del usuario sea correcta
      const expectedUserKey = crypto.createHash('sha256').update(userId + this.ENCRYPTION_KEY).digest('hex').substring(0, 8);

      if (userKey !== expectedUserKey) {
        throw new Error('Clave de usuario inválida');
      }

      return sensorId;
    } catch (error) {
      throw new Error(`Error al desobfuscar ID del sensor: ${error.message}`);
    }
  }

  async registerFinger(dedoRegistrado: { dedo: Dedos; huella: string }) {
    const createdFingerprint = new this.dedoRegistradoModel(dedoRegistrado);
    return createdFingerprint.save();
  }

  async getFingersByAccount(id: string) {
    try {
      const cuentaAppUsuario = await this.cuentaAppModel.findOne({ persona: id });

      if (!cuentaAppUsuario) {
        throw new BadRequestException('El usuario no existe');
      }

      const dedosPatron = await this.dedoPatronModel
        .find({ id_cuenta_app: cuentaAppUsuario._id })
        .populate({
          path: 'dedos_registrados',
          select: '_id dedo'
        })
        .exec();

      // Construir la lista de dedos patrón con su respectivo dedo registrado
      const resultado = dedosPatron.map(dp => {
        // Asegurar que haya al menos un dedo registrado
        if (dp.dedos_registrados) {
          const dedoRegistrado = dp.dedos_registrados;

          // Desobfuscar el ID del sensor para uso interno si es necesario
          let originalSensorId = null;
          try {
            originalSensorId = this.deobfuscateSensorId(dedoRegistrado.huella, id);
          } catch (error) {
            console.warn(`Error al desobfuscar ID para dedo ${dedoRegistrado.dedo}: ${error.message}`);
          }

          return {
            dedo_patron_id: dp._id,
            dedo: dedoRegistrado.dedo,
            // Opcional: incluir ID original para debugging (remover en producción)
            sensorId: originalSensorId
          };
        } else {
          return null;
        }
      }).filter(Boolean); // elimina los nulls

      return resultado;
    } catch (error) {
      throw new BadRequestException(`Error al obtener dedos registrados: ${error.message}`);
    }
  }

  async createFingerPattern(createFingerpatternDto: CreateFingerpatternDto) {
    // Validate that we have exactly 5 fingers in the pattern
    if (createFingerpatternDto.pattern.length !== 5) {
      throw new BadRequestException('El patrón debe contener exactamente 5 dedos');
    }

    // Check for duplicate fingers in the pattern
    const dedos = createFingerpatternDto.pattern.map(p => p.dedo);
    console.log("Patron completo:", createFingerpatternDto.pattern);
    console.log("Dedos extraídos:" + dedos);
    console.log("Valores únicos:", [...new Set(dedos)]);

    const uniqueDedos = new Set(dedos);
    if (uniqueDedos.size !== 5) {
      throw new BadRequestException('Los 5 dedos del patrón deben ser diferentes');
    }

    // Generate a unique ID for this pattern
    const patternId = new Types.ObjectId();

    // Create all fingers first with obfuscated sensor IDs
    const registeredFingers = await Promise.all(
      createFingerpatternDto.pattern.map(async fingerData => {
        // Ofuscar el ID del sensor antes de guardarlo
        const obfuscatedSensorId = this.obfuscateSensorId(fingerData.huella);

        console.log(`Dedo: ${fingerData.dedo} - ID original: ${fingerData.huella} -> ID obfuscado: ${obfuscatedSensorId}`);

        const finger = new this.dedoRegistradoModel({
          dedo: fingerData.dedo,
          huella: obfuscatedSensorId, // Guardar ID obfuscado
        });

        return finger.save();
      })
    );

    // Extraer cuenta App del userID - CORREGIDO el await
    const cuentaApp = await this.cuentaAppModel.findOne({ persona: createFingerpatternDto.userId });

    if (!cuentaApp) {
      throw new BadRequestException('No se encontró cuenta de aplicación para el usuario');
    }

    // Create the pattern entries
    const patternEntries = await Promise.all(
      createFingerpatternDto.pattern.map(async (fingerData, index) => {
        const matchingFinger = registeredFingers.find(f => f.dedo === fingerData.dedo);

        const patternEntry = new this.dedoPatronModel({
          id_dedo_patron: patternId,
          orden: fingerData.orden || index + 1,
          dedos_registrados: matchingFinger._id,
          id_cuenta_app: new Types.ObjectId(cuentaApp._id.toString()),
        });

        return patternEntry.save();
      })
    );

    return {
      success: true,
      patternId: patternId,
      entries: patternEntries,
      message: 'Patrón de huellas registrado exitosamente con IDs ofuscados',
      fingersRegistered: registeredFingers.length
    };
  }
  async getAccountIdByFingerprint(sensorId: string) {
  try {
    // Obtener todos los dedos registrados
    const allFingerprints = await this.dedoRegistradoModel.find({});
    
    // Buscar coincidencia
    for (const fingerprint of allFingerprints) {
      if (this.verifySensorId(sensorId, fingerprint.huella)) {
        
        // Encontrar el patrón asociado
        const patternEntry = await this.dedoPatronModel
          .findOne({ dedos_registrados: fingerprint._id });

        if (!patternEntry) continue;

        // Obtener la cuenta
        const account = await this.cuentaAppModel
          .findById(patternEntry.id_cuenta_app);

        if (!account) continue;

        return {
          found: true,
          accountId: account._id.toString(),
          personaId: account.persona.toString(),
          fingerInfo: {
            dedo: fingerprint.dedo,
            orden: patternEntry.orden
          }
        };
      }
    }

    return {
      found: false,
      message: 'Huella no encontrada'
    };

  } catch (error) {
    throw new BadRequestException(`Error: ${error.message}`);
  }
}
}