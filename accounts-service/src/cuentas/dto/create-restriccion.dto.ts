import { IsNumber, IsOptional, IsMongoId, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRestriccionDto {
  @ApiProperty({
    description: 'Monto mínimo para aplicar esta restricción',
    example: 100
  })
  @IsNumber()
  @Min(0)
  monto_desde: number;

  @ApiProperty({
    description: 'Monto máximo para aplicar esta restricción',
    example: 1000
  })
  @IsNumber()
  @Min(0)
  monto_hasta: number;

  @ApiPropertyOptional({
    description: 'ID del patrón de autenticación a utilizar',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsOptional()
  patron_autenticacion?: string;
}