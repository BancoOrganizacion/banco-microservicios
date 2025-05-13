import { IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { IsEcuadorianPhone, IsValidEmail } from '../../validador';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class UpdateUsuarioDto {
  @ApiPropertyOptional({

    // Nombre del usuario
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  nombre?: string;

  // Apellido del usuario
  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  apellido?: string;

  // email
  @ApiPropertyOptional({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@example.com'
  })
  @IsEmail()
  @IsOptional()
  @IsValidEmail({ message: 'El correo electrónico debe tener un formato válido y un dominio permitido' })
  email?: string;

  // numero de telefono
  @ApiPropertyOptional({
    description: 'Número de teléfono ecuatoriano (10 dígitos comenzando con 0)',
    example: '0991234567'
  })
  @IsString()
  @IsOptional()
  @IsEcuadorianPhone({ message: 'El número de teléfono debe tener 10 dígitos y comenzar con 0' })
  telefono?: string;
}