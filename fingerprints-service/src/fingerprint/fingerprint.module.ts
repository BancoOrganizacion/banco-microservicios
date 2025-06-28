import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CuentaApp, CuentaAppSchema, DedoRegistrado, DedosRegistrados,Cuenta,CuentaSchema } from 'shared-models';
import { FingerprintService } from './fingerprint.service';
import { FingerprintController } from './fingerprint.controller';
import { DedoPatron, DedoPatronSchema } from 'shared-models';
import { JwtDataGuard } from './guards/jwt-data.guard';

@Module({
    imports: [
        MongooseModule.forFeature([{
            name: DedoRegistrado.name,
            schema: DedosRegistrados
        },
        {
            name: DedoPatron.name,
            schema: DedoPatronSchema
        },
        {
            name: CuentaApp.name,
            schema: CuentaAppSchema
        },
        {
            name: Cuenta.name,
            schema: CuentaSchema
        },])
    ],
    providers: [FingerprintService,
        JwtDataGuard
    ],
    controllers: [FingerprintController],
    exports: [FingerprintService],
})
export class FingerprintModule { }
