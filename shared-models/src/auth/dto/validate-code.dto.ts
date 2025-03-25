import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ValidateCodeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  code: string;
}