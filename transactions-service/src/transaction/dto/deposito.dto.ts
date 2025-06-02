import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepositarDto {
  @ApiProperty({
    description: 'Número de cuenta destino (10 dígitos)',
    example: '1234567890',
    minLength: 10,
    maxLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'El número de cuenta debe tener exactamente 10 dígitos' })
  numero_cuenta_destino: string;

  @ApiProperty({
    description: 'Monto a depositar',
    example: 500.00
  })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
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

// transactions-service/src/transaction/dto/retiro.dto.ts
export class RetirarDto {
  @ApiProperty({
    description: 'Número de cuenta origen (10 dígitos)',
    example: '1234567890',
    minLength: 10,
    maxLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'El número de cuenta debe tener exactamente 10 dígitos' })
  numero_cuenta_origen: string;

  @ApiProperty({
    description: 'Monto a retirar',
    example: 200.00
  })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional({
    description: 'Descripción del retiro',
    example: 'Retiro en cajero automático'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}