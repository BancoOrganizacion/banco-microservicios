// Crear un DTO para la solicitud
import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetUserByCodeDto {
  @ApiProperty({
    description: "Código de verificación",
    example: "123456",
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
