import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DedoRegistrado, DedosRegistrados } from 'shared-models';
import { FingerprintService } from './fingerprint.service';
import { FingerprintController } from './fingerprint.controller';
import { DedoPatron, DedoPatronSchema } from 'shared-models';

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
