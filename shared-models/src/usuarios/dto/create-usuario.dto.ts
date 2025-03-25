import { IsString, IsEmail, IsNotEmpty, Length, IsOptional, IsMongoId, MinLength } from 'class-validator';
import { IsEcuadorianId, IsEcuadorianPhone, IsValidEmail } from '../../common/validador';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
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
  nombre_usuario: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  contraseña: string;
}