import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  ParseBoolPipe,
  BadRequestException,
} from '@nestjs/common';
import { PatternService } from './pattern.service';
import { PatronAutenticacion } from 'shared-models';

@Controller('patrones')
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  // Crear nuevo patrón
  @Post()
  async crearPatron(
    @Body('idCuentaApp') idCuentaApp: string,
    @Body('dedosPatronIds') dedosPatronIds: string[],
  ): Promise<PatronAutenticacion> {
    if (!idCuentaApp || !Array.isArray(dedosPatronIds)) {
      throw new BadRequestException('Datos incompletos para crear el patrón');
    }
    return this.patternService.crearPatronAutenticacion(idCuentaApp, dedosPatronIds);
  }

  // Obtener patrón por ID
  @Get(':id')
  async obtenerPatron(@Param('id') patronId: string): Promise<PatronAutenticacion> {
    return this.patternService.obtenerPatronPorId(patronId);
  }

  // Obtener los dedos patrón de un patrón
  @Get(':id/dedos')
  async obtenerDedos(@Param('id') patronId: string) {
    return this.patternService.obtenerDedosPatron(patronId);
  }

  // Obtener todos los patrones activos por cuenta
  @Get()
  async obtenerPatronesPorCuenta(@Query('cuenta') idCuentaApp: string) {
    if (!idCuentaApp) {
      throw new BadRequestException('El parámetro "cuenta" es obligatorio');
    }
    return this.patternService.obtenerPatronesPorCuenta(idCuentaApp);
  }

  // Activar o desactivar un patrón
  @Patch(':id/estado')
  async cambiarEstado(
    @Param('id') patronId: string,
    @Query('activo', ParseBoolPipe) activo: boolean,
  ) {
    return this.patternService.cambiarEstadoPatron(patronId, activo);
  }

  // Validar si un patrón está disponible para autenticación
  @Get(':id/validar')
  async validarPatron(@Param('id') patronId: string): Promise<{ valido: boolean }> {
    const valido = await this.patternService.validarPatronParaAutenticacion(patronId);
    return { valido };
  }

  // Obtener toda la información para autenticación
  @Get(':id/autenticacion')
  async obtenerParaAutenticacion(@Param('id') patronId: string) {
    return this.patternService.obtenerPatronParaAutenticacion(patronId);
  }
}
