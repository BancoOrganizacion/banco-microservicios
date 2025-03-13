import { Schema,Prop,SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export enum Dedos{
    PULGAR = "PULGAR",
    INDICE = "INDICE",
    MEDIO = "MEDIO",
    ANULAR = "ANULAR",
    MENIQUE = "MENIQUE",
}

@Schema({
    timestamps:true,
    collection: 'dedos_registrados',
}
)
export class DedoRegistrado extends Document {
    @Prop({required: true})
    dedo: Dedos;
    @Prop({required: true})
    huella:string;
}

export const DedosRegistrados = SchemaFactory.createForClass(DedoRegistrado)

