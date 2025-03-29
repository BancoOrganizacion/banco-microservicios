import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'telegram_tokens',
})
export class TelegramToken extends Document {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Usuario',
    required: true 
  })
  usuario: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiracion: Date;

  @Prop({ default: false })
  usado: boolean;
}

export const TelegramTokenSchema = SchemaFactory.createForClass(TelegramToken);