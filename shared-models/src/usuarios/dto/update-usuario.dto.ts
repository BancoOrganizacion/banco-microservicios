import { IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { IsEcuadorianPhone, IsValidEmail } from '../../common/validador';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  @Length(2, 50)
  nombre?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  apellido?: string;

  @IsEmail()
  @IsOptional()
  @IsValidEmail({ message: 'El correo electrónico debe tener un formato válido y un dominio permitido' })
  email?: string;

  @IsString()
  @IsOptional()
  @IsEcuadorianPhone({ message: 'El número de teléfono debe tener 10 dígitos y comenzar con 0' })
  telefono?: string;
}