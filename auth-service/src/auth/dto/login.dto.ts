import { IsString, IsNotEmpty } from 'class-validator';
import { IsValidName } from '../../validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario para iniciar sesión',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  @IsValidName({
    message:
      'El nombre solo puede contener letras, espacios, guiones bajos (_) y guiones medios (-)',
  })
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MySecurePass1!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
