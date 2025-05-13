import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class UpdateUsuarioRolDto {

  @ApiProperty({
    description: 'ID del nuevo rol a asignar',
    example: '6070f06d5c7b1a1a9c9b0b3a'
  })

  @IsMongoId()
  @IsNotEmpty()
  rolId: string;
}