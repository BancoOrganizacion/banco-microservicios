import { Body, Controller,Post } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';

@Controller('fingerprint')
export class FingerprintController {
    constructor (private fingerprintService:FingerprintService){}
    @Post()
    async create(@Body() createFingerprint:any){
        return this.fingerprintService.create(createFingerprint);
    }
}
