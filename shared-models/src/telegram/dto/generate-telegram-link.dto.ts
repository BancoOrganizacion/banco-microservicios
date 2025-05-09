import { IsMongoId, IsNotEmpty } from "class-validator";

export class GenerateTelegramLinkDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
