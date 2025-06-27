import { IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTransaccionesDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio para filtrar',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para filtrar',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @ApiPropertyOptional({
    description: 'Estado de la transacción',
    enum: ['PENDIENTE', 'COMPLETADA', 'FALLIDA', 'CANCELADA', 'AUTORIZADA', 'REVERSADA']
  })
  @IsOptional()
  @IsEnum(['PENDIENTE', 'COMPLETADA', 'FALLIDA', 'CANCELADA', 'AUTORIZADA', 'REVERSADA'])
  estado?: string;

  @ApiPropertyOptional({
    description: 'Página (para paginación)',
    example: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 10;
}