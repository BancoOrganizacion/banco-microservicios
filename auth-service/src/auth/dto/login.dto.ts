import { IsString, IsNotEmpty } from 'class-validator';
import { IsValidName } from '../../validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @IsValidName({
    message: 'El nombre solo puede contener letras, espacios, guiones bajos (_) y guiones medios (-)'
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}