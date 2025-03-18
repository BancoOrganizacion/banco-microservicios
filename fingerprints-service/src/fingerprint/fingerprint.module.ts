import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DedoRegistrado, DedosRegistrados } from './schemas/fingerprint.schemas';
import { FingerprintService } from './fingerprint.service';
import { FingerprintController } from './fingerprint.controller';
import { DedoPatron, DedoPatronSchema } from './schemas/dedopatron.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{
            name: DedoRegistrado.name,
            schema: DedosRegistrados
        },
        {
            name:DedoPatron.name,
            schema: DedoPatronSchema
        },])
    ],
    providers: [FingerprintService],
    controllers: [FingerprintController],
    exports:[FingerprintService],
})
export class FingerprintModule { }
