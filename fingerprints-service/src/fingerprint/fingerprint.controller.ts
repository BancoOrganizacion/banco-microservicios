import { Body, Controller, Post } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { Dedos } from 'shared-models';
import { CreateFingerpatternDto } from 'shared-models';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('fingerprints')
@Controller('fingerprint')
export class FingerprintController {
    constructor(private fingerprintService: FingerprintService) { }

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
    @Post('get-fingers')
    @ApiOperation({ summary: 'Obtener dedos registrados por cuenta' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                id_cuenta_app: {
                    type: 'string',
                    description: 'ID de la cuenta asociada',
                }
            },
            required: ['id_cuenta_app']
        }
    })
    @ApiResponse({ status: 200, description: 'Dedos registrados encontrados' })
    @ApiResponse({ status: 400, description: 'ID inválido o no se encontraron dedos' })
    async getFingersByAccount(@Body() body: { id_cuenta_app: string }) {
        return this.fingerprintService.getFingersByAccount(body.id_cuenta_app);
    }
}