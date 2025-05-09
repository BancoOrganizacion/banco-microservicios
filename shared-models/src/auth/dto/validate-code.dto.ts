import { IsString, IsNotEmpty, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ValidateCodeDto {
  @ApiProperty({
    description: "ID del usuario al que pertenece el código",
    example: "6070f06d5c7b1a1a9c9b0b3a",
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Código de verificación de 4 dígitos",
    example: "1234",
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  code: string;
}
