import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsOptional, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

// DTOs para Requests
export class CrearPatronAutenticacionDto {
  @ApiProperty({
    description: 'ID de la cuenta de aplicación',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsMongoId()
  idCuentaApp: string;

  @ApiProperty({
    description: 'Array de IDs de los dedos patrón',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsMongoId({ each: true })
  dedosPatronIds: string[];
}

export class CambiarEstadoPatronDto {
  @ApiProperty({
    description: 'Estado activo del patrón',
    example: true
  })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  activo: boolean;
}

// DTOs para Responses
export class DedoRegistradoResponseDto {
  @ApiProperty({
    description: 'ID del dedo registrado',
    example: '507f1f77bcf86cd799439014'
  })
  _id: string;
}

export class DedoPatronResponseDto {
  @ApiProperty({
    description: 'ID del documento',
    example: '507f1f77bcf86cd799439012'
  })
  _id: string;

  @ApiProperty({
    description: 'ID único del dedo patrón',
    example: '507f1f77bcf86cd799439012'
  })
  id_dedo_patron: string;

  @ApiProperty({
    description: 'Orden del dedo en el patrón',
    example: 1
  })
  orden: number;

  @ApiProperty({
    description: 'Dedo registrado asociado',
    type: DedoRegistradoResponseDto
  })
  dedos_registrados: DedoRegistradoResponseDto;

  @ApiProperty({
    description: 'ID de la cuenta de aplicación',
    example: '507f1f77bcf86cd799439011'
  })
  id_cuenta_app: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}

export class PatronAutenticacionResponseDto {
  @ApiProperty({
    description: 'ID del documento',
    example: '507f1f77bcf86cd799439010'
  })
  _id: string;

  @ApiProperty({
    description: 'ID único del patrón de autenticación',
    example: '507f1f77bcf86cd799439010'
  })
  id_patron_autenticacion: string;

  @ApiProperty({
    description: 'Fecha de creación del patrón',
    example: '2024-01-01T00:00:00.000Z'
  })
  fecha_creacion: Date;

  @ApiProperty({
    description: 'Estado activo del patrón',
    example: true
  })
  activo: boolean;

  @ApiProperty({
    description: 'Array de dedos patrón asociados',
    type: [DedoPatronResponseDto]
  })
  dedos_patron: DedoPatronResponseDto[];

  @ApiProperty({
    description: 'Fecha de creación del documento',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}

export class PatronParaAutenticacionResponseDto {
  @ApiProperty({
    description: 'Información del patrón de autenticación',
    type: PatronAutenticacionResponseDto
  })
  patron: PatronAutenticacionResponseDto;

  @ApiProperty({
    description: 'Array de dedos patrón para autenticación',
    type: [DedoPatronResponseDto]
  })
  dedosPatron: DedoPatronResponseDto[];
}

export class ValidacionPatronResponseDto {
  @ApiProperty({
    description: 'Indica si el patrón es válido para autenticación',
    example: true
  })
  esValido: boolean;
}