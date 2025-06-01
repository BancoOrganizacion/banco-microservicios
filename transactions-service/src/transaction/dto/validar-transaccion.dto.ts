import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ValidarTransaccionDto {
  @ApiProperty({
    description: 'ID de la cuenta origen',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  cuenta_origen: string;

  @ApiProperty({
    description: 'Monto de la transacción',
    example: 1500.00
  })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    description: 'ID de la cuenta destino (solo para transferencias)',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  @IsOptional()
  cuenta_destino?: string;

  @ApiProperty({
    description: 'Tipo de transacción',
    example: 'TRANSFERENCIA',
    enum: ['TRANSFERENCIA', 'DEPOSITO', 'RETIRO']
  })
  @IsString()
  @IsNotEmpty()
  tipo: string;
}