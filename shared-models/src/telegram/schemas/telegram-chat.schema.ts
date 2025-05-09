import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

@Schema({
  timestamps: true,
  collection: "telegram_chats",
})
export class TelegramChat extends Document {
  @Prop({ required: false, unique: true, sparse: true })
  telefono: string;

  @Prop({ required: true })
  chatId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  })
  usuario: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  activo: boolean;
}

export const TelegramChatSchema = SchemaFactory.createForClass(TelegramChat);
