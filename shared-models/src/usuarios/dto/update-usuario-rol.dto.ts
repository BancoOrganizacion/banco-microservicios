import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateUsuarioRolDto {
  @IsMongoId()
  @IsNotEmpty()
  rolId: string;
}