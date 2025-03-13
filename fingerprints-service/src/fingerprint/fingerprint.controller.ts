import { Body, Controller,Post } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { Dedos } from './schemas/fingerprint.schemas';
import { CreateFingerpatternDto } from './dto/create-fingerpattern.dto';

@Controller('fingerprint')
export class FingerprintController {
    constructor (private fingerprintService:FingerprintService){}
    @Post('register')
    async registerFinger(@Body() dedoRegistrado: { dedo: Dedos; huella: string }) {
        return this.fingerprintService.registerFinger(dedoRegistrado);
      }
      @Post('pattern')
  async createPattern(@Body() createFingerpatternDto: CreateFingerpatternDto) {
    return this.fingerprintService.createFingerPattern(createFingerpatternDto);
  }
}
