import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCuenta } from '../schemas/cuenta.schema';

export class UpdateCuentaDto {
  @ApiPropertyOptional({
    description: 'Estado de la cuenta',
    enum: EstadoCuenta,
    example: 'ACTIVA',
  })
  @IsEnum(EstadoCuenta)
  @IsOptional()
  estado?: EstadoCuenta;

  @ApiPropertyOptional({
    description: 'Tipo de cuenta (CORRIENTE, AHORROS)',
    example: 'CORRIENTE',
    enum: ['CORRIENTE', 'AHORROS'],
  })
  @IsString()
  @IsOptional()
  tipo_cuenta?: string;
}
