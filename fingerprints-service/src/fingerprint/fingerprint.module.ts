import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DedoRegistrado, DedosRegistrados } from './schemas/fingerprint.schemas';
import { FingerprintService } from './fingerprint.service';
import { FingerprintController } from './fingerprint.controller';

@Module({
    imports:[
        MongooseModule.forFeature([{
            name:DedoRegistrado.name,
            schema: DedosRegistrados
        }])
    ],
    providers:[FingerprintService],
    controllers:[FingerprintController]
})
export class FingerprintModule {}
