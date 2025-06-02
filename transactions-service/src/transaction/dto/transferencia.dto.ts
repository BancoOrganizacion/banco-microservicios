import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferirDto {
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
    description: 'Número de cuenta destino (10 dígitos)',
    example: '0987654321',
    minLength: 10,
    maxLength: 10
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'El número de cuenta debe tener exactamente 10 dígitos' })
  numero_cuenta_destino: string;

  @ApiProperty({
    description: 'Monto a transferir',
    example: 100.50
  })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional({
    description: 'Descripción de la transferencia',
    example: 'Pago de servicios'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}