import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterCodeDto {
  @IsString()
  @IsNotEmpty()
  tipo: string; // Por ejemplo: 'login', 'transaction', etc.
}