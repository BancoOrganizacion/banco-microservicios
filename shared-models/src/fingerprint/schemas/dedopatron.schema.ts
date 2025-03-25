import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { DedoRegistrado } from "./fingerprint.schemas";
import { CuentaApp } from '../../usuarios/schemas/usuario.schema';

@Schema({
  timestamps: true,
  collection: 'dedos_patron',
})
export class DedoPatron extends Document {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId,
    required: true 
  })
  id_dedo_patron: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true
  })
  orden: number;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'DedoRegistrado',
    required: true 
  })
  dedos_registrados: DedoRegistrado;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'CuentaApp',
    required: true 
  })
  id_cuenta_app: CuentaApp;
}

export const DedoPatronSchema = SchemaFactory.createForClass(DedoPatron);