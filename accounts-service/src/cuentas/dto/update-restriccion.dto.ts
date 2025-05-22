import { IsNumber, IsOptional, IsMongoId, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRestriccionDto {
  @ApiPropertyOptional({
    description: 'Monto mínimo para aplicar esta restricción',
    example: 100
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monto_desde?: number;

  @ApiPropertyOptional({
    description: 'Monto máximo para aplicar esta restricción',
    example: 1000
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monto_hasta?: number;

  @ApiPropertyOptional({
    description: 'ID del patrón de autenticación a utilizar',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsOptional()
  patron_autenticacion?: string;
}