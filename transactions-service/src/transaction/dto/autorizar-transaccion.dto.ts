import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class AutorizarTransaccionDto {
    @ApiProperty({
    description: 'ID de la transacción a autorizar',
    example: '507f1f77bcf86cd799439013'
  })
  @IsMongoId()
  @IsNotEmpty()
  transaccion_id: string;

  @ApiProperty({
    description: 'Código de verificación',
    example: '1234'
  })
  @IsString()
  @IsNotEmpty()
  codigo_verificacion: string;

  @ApiPropertyOptional({
    description: 'ID del patrón de autenticación usado',
    example: '507f1f77bcf86cd799439014'
  })
  @IsMongoId()
  @IsOptional()
  patron_autenticacion_id?: string;
}