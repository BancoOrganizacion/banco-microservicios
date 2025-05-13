import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @Length(2, 50)
  nombre?: string;

  @IsString()
  @IsOptional()
  @Length(0, 200)
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}