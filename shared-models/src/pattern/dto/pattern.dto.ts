// src/pattern/dto/pattern.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export class CrearPatronDto {
  @ApiProperty({
    description: 'Array de IDs de dedos patrón para crear el patrón de autenticación',
    example: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456', 'dedo_medio_izquierdo_789'],
    type: [String],
    minItems: 1,
  })
  @IsArray({ message: 'dedosPatronIds debe ser un array' })
  @ArrayNotEmpty({ message: 'dedosPatronIds no puede estar vacío' })
  @IsString({ each: true, message: 'Cada elemento de dedosPatronIds debe ser un string' })
  dedosPatronIds: string[];
}

export class PatronAutenticacionResponse {
  @ApiProperty({
    description: 'ID único del patrón de autenticación',
    example: 'patron_abc123def456',
  })
  id: string;

  @ApiProperty({
    description: 'ID de la cuenta de la aplicación (obtenido del JWT)',
    example: 'cuenta_usuario_789',
  })
  idCuentaApp: string;

  @ApiProperty({
    description: 'Array de IDs de dedos patrón asociados',
    example: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456', 'dedo_medio_izquierdo_789'],
    type: [String],
  })
  dedosPatronIds: string[];

  @ApiProperty({
    description: 'Estado del patrón (activo/inactivo)',
    example: true,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Fecha de creación del patrón',
    example: '2025-05-29T10:30:00.000Z',
  })
  fechaCreacion: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-05-29T10:30:00.000Z',
  })
  fechaActualizacion: Date;
}

export class DedosPatronResponse {
  @ApiProperty({
    description: 'Array de dedos patrón con su información detallada',
    example: [
      {
        id: 'dedo_pulgar_derecho_123',
        nombre: 'Pulgar derecho',
        template: 'Rk1SACAyMAAAAAFgAAABPQFhAMUAxQEAAAAnYQC1...',
        calidad: 85
      },
      {
        id: 'dedo_indice_derecho_456',
        nombre: 'Índice derecho',
        template: 'Rk1SACAyMAAAAAFgAAABPQFhAMUAxQEAAAAnYQC2...',
        calidad: 92
      }
    ],
  })
  dedos: any[];
}

export class ValidacionPatronResponse {
  @ApiProperty({
    description: 'Indica si el patrón es válido para autenticación',
    example: true,
  })
  valido: boolean;
}

export class EstadoPatronResponse {
  @ApiProperty({
    description: 'ID del patrón actualizado',
    example: 'patron_abc123def456',
  })
  id: string;

  @ApiProperty({
    description: 'Nuevo estado del patrón',
    example: false,
  })
  activo: boolean;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Estado del patrón actualizado correctamente',
  })
  mensaje: string;
}

export class AutenticacionPatronResponse {
  @ApiProperty({
    description: 'Información del patrón para autenticación',
    example: {
      id: 'patron_abc123def456',
      idCuentaApp: 'cuenta_usuario_789',
      activo: true,
      dedosPatronIds: ['dedo_pulgar_derecho_123', 'dedo_indice_derecho_456']
    }
  })
  patron: {
    id: string;
    idCuentaApp: string;
    activo: boolean;
    dedosPatronIds: string[];
  };

  @ApiProperty({
    description: 'Templates biométricos para autenticación',
    example: [
      {
        id: 'dedo_pulgar_derecho_123',
        nombre: 'Pulgar derecho',
        template: 'Rk1SACAyMAAAAAFgAAABPQFhAMUAxQEAAAAnYQC1...',
        calidad: 85
      }
    ]
  })
  templates: Array<{
    id: string;
    nombre: string;
    template: string;
    calidad: number;
  }>;

  @ApiProperty({
    description: 'Metadatos adicionales',
    example: {
      algoritmo: 'ISO_19794_2',
      version: '2.0',
      fechaGeneracion: '2025-05-29T10:30:00.000Z'
    }
  })
  metadatos: {
    algoritmo: string;
    version: string;
    fechaGeneracion: string;
  };
}