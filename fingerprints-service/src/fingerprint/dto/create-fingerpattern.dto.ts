import { IsString, IsNotEmpty, IsEnum, IsArray, IsInt, Min, Max, ValidateNested, ArrayMinSize, ArrayMaxSize, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Dedos } from '../schemas/fingerprint.schemas';

class FingerpatternItemDto {
  @IsEnum(Dedos, { message: 'El dedo debe ser uno de los siguientes: PULGAR, INDICE, MEDIO, ANULAR, MENIQUE' })
  @IsNotEmpty({ message: 'El tipo de dedo es requerido' })
  dedo: Dedos;

  @IsString({ message: 'La huella debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La huella es requerida' })
  huella: string;

  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(1, { message: 'El orden mínimo es 1' })
  @Max(5, { message: 'El orden máximo es 5' })
  orden: number;
}

export class CreateFingerpatternDto {
  @IsMongoId({ message: 'El ID de usuario debe ser un ID de MongoDB válido' })
  @IsNotEmpty({ message: 'El ID de usuario es requerido' })
  userId: string;

  @IsArray({ message: 'El patrón debe ser un arreglo' })
  @ValidateNested({ each: true })
  @ArrayMinSize(5, { message: 'El patrón debe contener exactamente 5 dedos' })
  @ArrayMaxSize(5, { message: 'El patrón debe contener exactamente 5 dedos' })
  @Type(() => FingerpatternItemDto)
  pattern: FingerpatternItemDto[];
}