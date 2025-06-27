import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { DedoPatron } from "../../fingerprint/schemas/dedopatron.schema";

@Schema({
  timestamps: true,
  collection: 'patron_autenticacion',
})
export class PatronAutenticacion extends Document {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId,
    required: true,
    unique: true
  })
  id_patron_autenticacion: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  })
  nombre: string;

  @Prop({
    type: Date,
    default: Date.now,
    required: true
  })
  fecha_creacion: Date;

  @Prop({
    type: Boolean,
    default: true,
    required: true
  })
  activo: boolean;

  @Prop({ 
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'DedoPatron' }],
    required: true
  })
  dedos_patron: DedoPatron[];
}

export const PatronAutenticacionSchema = SchemaFactory.createForClass(PatronAutenticacion);