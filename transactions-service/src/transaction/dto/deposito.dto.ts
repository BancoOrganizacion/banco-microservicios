import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepositarDto {
  @ApiProperty({
    description: 'ID de la cuenta destino',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  cuenta_destino: string;

  @ApiProperty({
    description: 'Monto a depositar',
    example: 500.00
  })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    description: 'Descripción del depósito',
    example: 'Depósito en efectivo'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Referencia externa del depósito',
    example: 'DEP-2024-001'
  })
  @IsString()
  @IsOptional()
  referencia_externa?: string;
}