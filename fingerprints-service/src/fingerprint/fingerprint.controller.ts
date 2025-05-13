import { Body, Controller, Post } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { Dedos } from 'shared-models';
import { CreateFingerpatternDto } from 'shared-models';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('fingerprints')
@Controller('fingerprint')
export class FingerprintController {
    constructor(private fingerprintService: FingerprintService) {}
    
    @Post('register')
    @ApiOperation({ summary: 'Registrar una huella digital' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                dedo: { 
                    type: 'string', 
                    description: 'Tipo de dedo', 
                    enum: Object.values(Dedos)
                },
                huella: { 
                    type: 'string', 
                    description: 'Datos de la huella digital en formato string' 
                }
            },
            required: ['dedo', 'huella']
        }
    })
    @ApiResponse({ status: 201, description: 'Huella registrada con éxito' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    async registerFinger(@Body() dedoRegistrado: { dedo: Dedos; huella: string }) {
        return this.fingerprintService.registerFinger(dedoRegistrado);
    }
    
    @Post('pattern')
    @ApiOperation({ summary: 'Crear un patrón de huella digital' })
    @ApiBody({ type: CreateFingerpatternDto })
    @ApiResponse({ status: 201, description: 'Patrón de huella creado con éxito' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    async createPattern(@Body() createFingerpatternDto: CreateFingerpatternDto) {
        return this.fingerprintService.createFingerPattern(createFingerpatternDto);
    }
}