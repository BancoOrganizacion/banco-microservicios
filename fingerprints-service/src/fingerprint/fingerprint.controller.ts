import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
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
    @Post('get-account')
    @UseGuards(JwtDataGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Obtener cuenta por huella dactilar' })
    @ApiBody({
        description: 'ID del sensor para identificar al usuario',
        schema: {
            type: 'object',
            properties: {
                sensorId: {
                    type: 'string',
                    description: 'ID del sensor de huellas (viene del Arduino)',
                    example: '42'
                }
            },
            required: ['sensorId']
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Usuario identificado correctamente por huella',
        schema: {
            type: 'object',
            properties: {
                found: { type: 'boolean', example: true },
                accountId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                personaId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                fingerInfo: {
                    type: 'object',
                    properties: {
                        dedo: { type: 'string', example: 'INDICE' },
                        orden: { type: 'number', example: 2 }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Huella no encontrada',
        schema: {
            type: 'object',
            properties: {
                found: { type: 'boolean', example: false },
                message: { type: 'string', example: 'Huella no encontrada' }
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Datos inválidos - sensorId requerido' })
    @ApiResponse({ status: 401, description: 'No autorizado - Token requerido' })
    @ApiResponse({ status: 403, description: 'Token inválido' })
    async getAccountIdByFingerprint(@Body() body: { sensorId: string }) {
        // Validar que se envíe el sensorId
        if (!body.sensorId) {
            throw new BadRequestException('sensorId es requerido');
        }
        // Llamar al servicio para identificar usuario por huella
        return this.fingerprintService.getAccountIdByFingerprint(body.sensorId);
    }

}