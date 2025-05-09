import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterCodeDto {
  @ApiProperty({
    description: "Tipo de código a generar (login, transaction, etc.)",
    example: "login",
    enum: ["login", "transaction", "register"],
  })
  @IsString()
  @IsNotEmpty()
  tipo: string; // Por ejemplo: 'login', 'transaction', etc.
}
