import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DedoRegistrado, Dedos } from 'shared-models';
import { DedoPatron } from 'shared-models';
import { CreateFingerpatternDto } from 'shared-models';
import { CuentaApp } from 'shared-models';

@Injectable()
export class FingerprintService {
  constructor(
    @InjectModel(DedoRegistrado.name) private dedoRegistradoModel: Model<DedoRegistrado>,
    @InjectModel(DedoPatron.name) private dedoPatronModel: Model<DedoPatron>,
    @InjectModel(CuentaApp.name) private cuentaAppModel: Model<CuentaApp>
  ) { }

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
        // Aquí asumimos que cada dedo patrón tiene solo un dedo registrado asociado
        const dedoRegistrado = dp.dedos_registrados;
        return {
          dedo_patron_id: dp._id,
          dedo: dedoRegistrado.dedo
        };
      } else {
        return null; // o podrías filtrar más adelante
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
    console.log("Valores únicos:", [... new Set(dedos)])
    const uniqueDedos = new Set(dedos);
    if (uniqueDedos.size !== 5) {
      throw new BadRequestException('Los 5 dedos del patrón deben ser diferentes');
    }

    // Generate a unique ID for this pattern
    const patternId = new Types.ObjectId();

    // Create all fingers first
    const registeredFingers = await Promise.all(
      createFingerpatternDto.pattern.map(async fingerData => {
        const finger = new this.dedoRegistradoModel({
          dedo: fingerData.dedo,
          huella: fingerData.huella,
        });
        return finger.save();
      })
    );

    // Create the pattern entries
    const patternEntries = await Promise.all(
      createFingerpatternDto.pattern.map(async (fingerData, index) => {
        const matchingFinger = registeredFingers.find(f => f.dedo === fingerData.dedo);

        const patternEntry = new this.dedoPatronModel({
          id_dedo_patron: patternId,
          orden: fingerData.orden || index + 1, // Use provided order or default to position
          dedos_registrados: matchingFinger._id,
          id_cuenta_app: new Types.ObjectId(createFingerpatternDto.userId),
        });

        return patternEntry.save();
      })
    );

    return {
      patternId: patternId,
      entries: patternEntries,
    };
  }
}