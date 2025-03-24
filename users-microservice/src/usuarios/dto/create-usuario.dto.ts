import { IsString, IsEmail, IsNotEmpty, Length, IsOptional, IsMongoId, MinLength } from 'class-validator';
import { IsEcuadorianId, IsEcuadorianPhone, IsValidEmail, IsStrongPassword, IsValidName } from '../../validador';

export class CreateUsuarioDto {
  // Nombre
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @IsValidName({
    message: 'El nombre solo puede contener letras y espacios'
  })
  nombre: string;

  // Apellido
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @IsValidName({
    message: 'El apellido solo puede contener letras y espacios'
  })
  apellido: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 20)
  @IsEcuadorianId({ message: 'La cédula debe ser una cédula ecuatoriana válida de 10 dígitos' })
  cedula: string;

  @IsEmail()
  @IsNotEmpty()
  @IsValidEmail({ message: 'El correo electrónico debe tener un formato válido y un dominio permitido' })
  email: string;

  @IsString()
  @IsOptional()
  @IsEcuadorianPhone({ message: 'El número de teléfono debe tener 10 dígitos y comenzar con 0' })
  telefono?: string;

  @IsMongoId()
  @IsNotEmpty()
  rol: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  @IsValidName({
    message: 'El nombre de usuario solo puede contener letras, espacios, guiones bajos (_) y guiones medios (-)'
  })
  nombre_usuario: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    message: 'La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
  })
  contraseña: string;
}