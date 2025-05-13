import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  nombre: string;

  @IsString()
  @IsOptional()
  @Length(0, 200)
  descripcion?: string;
}