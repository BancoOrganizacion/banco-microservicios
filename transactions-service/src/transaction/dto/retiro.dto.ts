import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class RetirarDto {
  @ApiProperty({
    description: 'ID de la cuenta origen',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  cuenta_origen: string;

  @ApiProperty({
    description: 'Monto a retirar',
    example: 200.00
  })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    description: 'Descripción del retiro',
    example: 'Retiro en cajero automático'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}