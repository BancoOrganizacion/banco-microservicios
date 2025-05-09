import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Length,
  IsOptional,
  IsMongoId,
  MinLength,
} from 'class-validator';
import {
  IsEcuadorianId,
  IsEcuadorianPhone,
  IsValidEmail,
  IsStrongPassword,
  IsValidName,
} from '../../validador';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  // Nombre
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @IsValidName({
    message: 'El nombre solo puede contener letras y espacios',
  })
  nombre: string;

  // Apellido
  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Almeida',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @IsValidName({
    message: 'El apellido solo puede contener letras y espacios',
  })
  apellido: string;

  // cedula
  @ApiProperty({
    description: 'Cédula ecuatoriana (10 dígitos)',
    example: '1712345678',
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  @IsEcuadorianId({
    message: 'La cédula debe ser una cédula ecuatoriana válida de 10 dígitos',
  })
  cedula: string;

  //email
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsValidEmail({
    message:
      'El correo electrónico debe tener un formato válido y un dominio permitido',
  })
  email: string;

  // telefono
  @ApiProperty({
    description: 'Número de teléfono ecuatoriano (10 dígitos comenzando con 0)',
    example: '0991234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEcuadorianPhone({
    message: 'El número de teléfono debe tener 10 dígitos y comenzar con 0',
  })
  telefono?: string;

  // rol
  @ApiProperty({
    description: 'ID del rol asignado al usuario',
    example: '6070f06d5c7b1a1a9c9b0b3a',
  })
  @IsMongoId()
  @IsNotEmpty()
  rol: string;

  // nombre_usuario
  @ApiProperty({
    description: 'Nombre de usuario para iniciar sesión',
    example: 'juan_perez',
    minLength: 4,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  @IsValidName({
    message:
      'El nombre de usuario solo puede contener letras, espacios, guiones bajos (_) y guiones medios (-)',
  })
  nombre_usuario: string;

  // contraseña
  @ApiProperty({
    description: 'Contraseña segura',
    example: 'Abcd1234!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message:
      'La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  })
  contraseña: string;
}
