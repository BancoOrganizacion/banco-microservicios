import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { Dedos } from 'shared-models';
import { CreateFingerpatternDto } from 'shared-models';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtDataGuard } from './guards/jwt-data.guard';
import { GetUserId, CurrentUser } from './decorators/user.decorator';

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
    @UseGuards(JwtDataGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Crear un patrón de huella digital' })
    @ApiBody({ type: CreateFingerpatternDto })
    @ApiResponse({ status: 201, description: 'Patrón de huella creado con éxito' })
    @ApiResponse({ status: 401, description: 'No autorizado - Token requerido' })
    @ApiResponse({ status: 403, description: 'Token inválido' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    async createPattern(@Body() createFingerpatternDto: CreateFingerpatternDto) {
        return this.fingerprintService.createFingerPattern(createFingerpatternDto);
    }

    @Post('get-fingers')
    @UseGuards(JwtDataGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener dedos registrados del usuario autenticado' })
    @ApiResponse({ 
        status: 200, 
        description: 'Dedos registrados encontrados para el usuario autenticado',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    dedo: { type: 'string' },
                    huella: { type: 'string' },
                    // Agrega aquí las propiedades que retorna tu servicio
                }
            }
        }
    })
    @ApiResponse({ status: 401, description: 'No autorizado - Token requerido' })
    @ApiResponse({ status: 403, description: 'Token inválido' })
    @ApiResponse({ status: 404, description: 'No se encontraron dedos registrados para este usuario' })
    async getFingersByAccount(@GetUserId() userId: string) {
        //Llamar al servicio con el ID del usuario del JWT
        return this.fingerprintService.getFingersByAccount(userId);
    }
}