import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsMongoId,
} from "class-validator";
import { Type } from "class-transformer";
import { Dedos } from "../schemas/fingerprint.schemas";
import { ApiProperty } from "@nestjs/swagger";

export class FingerpatternItemDto {
  @ApiProperty({
    description: "Tipo de dedo",
    enum: Dedos,
    example: "PULGAR",
    required: true,
  })
  @IsEnum(Dedos, {
    message:
      "El dedo debe ser uno de los siguientes: PULGAR, INDICE, MEDIO, ANULAR, MENIQUE",
  })
  @IsNotEmpty({ message: "El tipo de dedo es requerido" })
  dedo: Dedos;

  @ApiProperty({
    description: "Datos de la huella digital en formato string",
    example: "base64EncodedFingerprint...",
    required: true,
  })
  @IsString({ message: "La huella debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La huella es requerida" })
  huella: string;

  @ApiProperty({
    description: "Orden del dedo (1-5)",
    minimum: 1,
    maximum: 5,
    example: 1,
    required: true,
  })
  @IsInt({ message: "El orden debe ser un número entero" })
  @Min(1, { message: "El orden mínimo es 1" })
  @Max(5, { message: "El orden máximo es 5" })
  orden: number;
}

export class CreateFingerpatternDto {
  @ApiProperty({
    description: "ID del usuario en formato MongoDB ObjectId",
    example: "507f1f77bcf86cd799439011",
    required: true,
  })
  @IsMongoId({ message: "El ID de usuario debe ser un ID de MongoDB válido" })
  @IsNotEmpty({ message: "El ID de usuario es requerido" })
  userId: string;

  @ApiProperty({
    description: "Arreglo de 5 huellas digitales",
    type: [FingerpatternItemDto],
    example: [
      { dedo: "PULGAR", huella: "base64EncodedFingerprint1...", orden: 1 },
      { dedo: "INDICE", huella: "base64EncodedFingerprint2...", orden: 2 },
      { dedo: "MEDIO", huella: "base64EncodedFingerprint3...", orden: 3 },
      { dedo: "ANULAR", huella: "base64EncodedFingerprint4...", orden: 4 },
      { dedo: "MENIQUE", huella: "base64EncodedFingerprint5...", orden: 5 },
    ],
    required: true,
  })
  @IsArray({ message: "El patrón debe ser un arreglo" })
  @ValidateNested({ each: true })
  @ArrayMinSize(5, { message: "El patrón debe contener exactamente 5 dedos" })
  @ArrayMaxSize(5, { message: "El patrón debe contener exactamente 5 dedos" })
  @Type(() => FingerpatternItemDto)
  pattern: FingerpatternItemDto[];
}
