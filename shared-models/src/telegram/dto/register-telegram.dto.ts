import { IsString, IsNotEmpty } from "class-validator";

export class RegisterTelegramDto {
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;
}
