import { IsString, IsNotEmpty, IsNumber, Min, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidarTransaccionDto {
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
    description: 'Monto de la transferencia',
    example: 1500.00
  })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

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
}