import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'registration_codes',
})
export class RegistrationCode extends Document {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Usuario',
    required: true 
  })
  usuario: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  codigo: string;

  @Prop({ required: true })
  tipo: string;

  @Prop({ required: true })
  expiracion: Date;

  @Prop({ default: false })
  usado: boolean;

  @Prop({ type: Date })
  ttlExpiracion: Date;
}

export const RegistrationCodeSchema = SchemaFactory.createForClass(RegistrationCode);

// El campo sobre el que aplicamos el índice TTL debe existir en el esquema
RegistrationCodeSchema.index({ ttlExpiracion: 1 }, { expireAfterSeconds: 0 });