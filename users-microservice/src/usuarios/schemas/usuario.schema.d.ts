import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../../roles/schemas/role.schema';
export declare class Usuario extends Document {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  rol: Role;
  activo: boolean;
}
export declare const UsuarioSchema: MongooseSchema<
  Usuario,
  import('mongoose').Model<
    Usuario,
    any,
    any,
    any,
    Document<unknown, any, Usuario> &
      Usuario &
      Required<{
        _id: unknown;
      }> & {
        __v: number;
      },
    any
  >,
  {},
  {},
  {},
  {},
  import('mongoose').DefaultSchemaOptions,
  Usuario,
  Document<unknown, {}, import('mongoose').FlatRecord<Usuario>> &
    import('mongoose').FlatRecord<Usuario> &
    Required<{
      _id: unknown;
    }> & {
      __v: number;
    }
>;
export declare class CuentaApp extends Document {
  nombre_usuario: string;
  contraseña: string;
  persona: Usuario;
  cuentas: MongooseSchema.Types.ObjectId[];
  dispositivo_autorizado: MongooseSchema.Types.ObjectId;
}
export declare const CuentaAppSchema: MongooseSchema<
  CuentaApp,
  import('mongoose').Model<
    CuentaApp,
    any,
    any,
    any,
    Document<unknown, any, CuentaApp> &
      CuentaApp &
      Required<{
        _id: unknown;
      }> & {
        __v: number;
      },
    any
  >,
  {},
  {},
  {},
  {},
  import('mongoose').DefaultSchemaOptions,
  CuentaApp,
  Document<unknown, {}, import('mongoose').FlatRecord<CuentaApp>> &
    import('mongoose').FlatRecord<CuentaApp> &
    Required<{
      _id: unknown;
    }> & {
      __v: number;
    }
>;
