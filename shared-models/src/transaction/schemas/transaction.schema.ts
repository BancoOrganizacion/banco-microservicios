import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum TipoTransaccion {
  TRANSFERENCIA = 'TRANSFERENCIA',
  DEPOSITO = 'DEPOSITO',
  RETIRO = 'RETIRO',
}

export enum EstadoTransaccion {
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  FALLIDA = 'FALLIDA',
  CANCELADA = 'CANCELADA',
  AUTORIZADA = 'AUTORIZADA',
  REVERSADA = 'REVERSADA'
}

@Schema({
  timestamps: true,
  collection: 'transacciones',
})
export class Transaccion extends Document {
  @Prop({ required: true, unique: true })
  numero_transaccion: string;

  @Prop({ 
    type: String, 
    enum: TipoTransaccion,
    required: true 
  })
  tipo: TipoTransaccion;

  @Prop({ required: true })
  monto: number;

  @Prop({ required: false })
  montoAnterior: number;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Cuenta',
    required: true 
  })
  cuenta_origen: MongooseSchema.Types.ObjectId;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Cuenta',
    required: false
  })
  cuenta_destino?: MongooseSchema.Types.ObjectId;

  @Prop()
  descripcion: string;

  @Prop({ 
    type: String, 
    enum: EstadoTransaccion,
    default: EstadoTransaccion.COMPLETADA 
  })
  estado: EstadoTransaccion;

  @Prop({ default: 0 })
  comision: number;

  @Prop({ type: Date, default: null })
  fecha_procesamiento: Date;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Usuario',
    required: true 
  })
  usuario_ejecutor: MongooseSchema.Types.ObjectId;

  @Prop()
  referencia_externa: string;

  @Prop({ default: false })
  requiere_autenticacion: boolean;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'PatronAutenticacion',
    required: false 
  })
  patron_autenticacion_usado?: MongooseSchema.Types.ObjectId;

  @Prop()
  motivo_fallo: string;

  @Prop({ type: Date, default: null })
  fecha_autorizacion: Date;

  @Prop()
  codigo_verificacion: string;

  // AGREGAR EXPLÍCITAMENTE LAS PROPIEDADES DE TIMESTAMPS
  createdAt?: Date;
  updatedAt?: Date;
}

export const TransaccionSchema = SchemaFactory.createForClass(Transaccion);

// Índices para optimizar consultas
TransaccionSchema.index({ cuenta_origen: 1, createdAt: -1 });
TransaccionSchema.index({ cuenta_destino: 1, createdAt: -1 });
TransaccionSchema.index({ usuario_ejecutor: 1, createdAt: -1 });
TransaccionSchema.index({ numero_transaccion: 1 });
TransaccionSchema.index({ estado: 1 });
TransaccionSchema.index({ tipo: 1, createdAt: -1 });