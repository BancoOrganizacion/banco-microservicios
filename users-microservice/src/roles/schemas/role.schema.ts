import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'roles',
})
export class Role extends Document {
  @Prop({ required: true, unique: true })
  nombre: string;

  @Prop()
  descripcion: string;

  @Prop({ default: true })
  activo: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
