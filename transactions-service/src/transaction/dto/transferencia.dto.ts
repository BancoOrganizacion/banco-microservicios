import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferirDto {
  @ApiProperty({
    description: 'ID de la cuenta origen',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  cuenta_origen: string;

  @ApiProperty({
    description: 'ID de la cuenta destino',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  @IsNotEmpty()
  cuenta_destino: string;

  @ApiProperty({
    description: 'Monto a transferir',
    example: 100.50
  })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    description: 'Descripción de la transferencia',
    example: 'Pago de servicios'
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}