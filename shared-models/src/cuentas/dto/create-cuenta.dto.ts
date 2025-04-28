import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCuentaDto {
  @ApiProperty({
    description: 'ID del titular de la cuenta (usuario)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  titular: string;

  @ApiPropertyOptional({
    description: 'Tipo de cuenta (CORRIENTE, AHORROS)',
    example: 'CORRIENTE',
    enum: ['CORRIENTE', 'AHORROS']
  })
  @IsString()
  @IsOptional()
  tipo_cuenta?: string;
}