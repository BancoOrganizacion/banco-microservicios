import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DedoRegistrado } from './schemas/fingerprint.schemas';
import { Model } from 'mongoose';

@Injectable()
export class FingerprintService {
    constructor(
        @InjectModel(DedoRegistrado.name) private dedoRegistradoModel: Model<DedoRegistrado>
    ){}
    async create(dedoRegistrado:any){
        const createdFingerprint = new this.dedoRegistradoModel(dedoRegistrado);
        return createdFingerprint.save()
    }
}
