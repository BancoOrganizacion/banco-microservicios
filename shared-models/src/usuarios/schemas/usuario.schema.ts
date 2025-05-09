import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { Role } from "../../roles/schemas/role.schema";

@Schema({
  timestamps: true,
  collection: "personas",
})
export class Usuario extends Document {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  apellido: string;

  @Prop({ required: true, unique: true })
  cedula: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  telefono: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Role",
    required: true,
  })
  rol: Role;

  @Prop({ default: true })
  activo: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

@Schema({
  timestamps: true,
  collection: "cuentas_app",
})
export class CuentaApp extends Document {
  @Prop({ required: true, unique: true })
  nombre_usuario: string;

  @Prop({ required: true })
  contraseña: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  })
  persona: Usuario;

  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  cuentas: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  dispositivo_autorizado: MongooseSchema.Types.ObjectId;
}

export const CuentaAppSchema = SchemaFactory.createForClass(CuentaApp);
