import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DedoRegistrado, Dedos } from './schemas/fingerprint.schemas';
import { DedoPatron } from './schemas/dedopatron.schema';
import { CreateFingerpatternDto } from './dto/create-fingerpattern.dto';

@Injectable()
export class FingerprintService {
  constructor(
    @InjectModel(DedoRegistrado.name) private dedoRegistradoModel: Model<DedoRegistrado>,
    @InjectModel(DedoPatron.name) private dedoPatronModel: Model<DedoPatron>
  ) {}

  async registerFinger(dedoRegistrado: { dedo: Dedos; huella: string }) {
    const createdFingerprint = new this.dedoRegistradoModel(dedoRegistrado);
    return createdFingerprint.save();
  }

  async createFingerPattern(createFingerpatternDto: CreateFingerpatternDto) {
    // Validate that we have exactly 5 fingers in the pattern
    if (createFingerpatternDto.pattern.length !== 5) {
      throw new BadRequestException('El patrón debe contener exactamente 5 dedos');
    }

    // Check for duplicate fingers in the pattern
    const dedos = createFingerpatternDto.pattern.map(p => p.dedo);
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