import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Usuario } from 'shared-models';

export enum EstadoCuenta {
  ACTIVA = 'ACTIVA',
  BLOQUEADA = 'BLOQUEADA',
  INACTIVA = 'INACTIVA',
  CANCELADA = 'CANCELADA',
}

@Schema({
  timestamps: true,
  collection: 'restricciones',
})
export class Restriccion extends Document {
  @Prop({ required: true })
  monto_desde: number;

  @Prop({ required: true })
  monto_hasta: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PatronAutenticacion',
    required: false,
  })
  patron_autenticacion: MongooseSchema.Types.ObjectId;
}

export const RestriccionSchema = SchemaFactory.createForClass(Restriccion);

@Schema({
  timestamps: true,
  collection: 'cuentas',
})
export class Cuenta extends Document {
  @Prop({ required: true, unique: true, length: 10 })
  numero_cuenta: string;

  @Prop({ required: true, default: 0 })
  monto_actual: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  })
  titular: Usuario;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Movimiento' }],
    default: [],
  })
  movimientos: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [RestriccionSchema], default: [] })
  restricciones: Restriccion[];

  @Prop({
    type: String,
    enum: EstadoCuenta,
    default: EstadoCuenta.ACTIVA,
  })
  estado: EstadoCuenta;

  @Prop({ type: Date, default: null })
  fecha_ultimo_movimiento: Date;

  @Prop({ required: true, default: 'CORRIENTE' })
  tipo_cuenta: string;
}

export const CuentaSchema = SchemaFactory.createForClass(Cuenta);
