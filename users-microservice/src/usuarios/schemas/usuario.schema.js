'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.CuentaAppSchema =
  exports.CuentaApp =
  exports.UsuarioSchema =
  exports.Usuario =
    void 0;
const mongoose_1 = require('@nestjs/mongoose');
const mongoose_2 = require('mongoose');
const role_schema_1 = require('../../roles/schemas/role.schema');
let Usuario = class Usuario extends mongoose_2.Document {};
exports.Usuario = Usuario;
__decorate(
  [(0, mongoose_1.Prop)({ required: true }), __metadata('design:type', String)],
  Usuario.prototype,
  'nombre',
  void 0,
);
__decorate(
  [(0, mongoose_1.Prop)({ required: true }), __metadata('design:type', String)],
  Usuario.prototype,
  'apellido',
  void 0,
);
__decorate(
  [
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata('design:type', String),
  ],
  Usuario.prototype,
  'cedula',
  void 0,
);
__decorate(
  [
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata('design:type', String),
  ],
  Usuario.prototype,
  'email',
  void 0,
);
__decorate(
  [(0, mongoose_1.Prop)(), __metadata('design:type', String)],
  Usuario.prototype,
  'telefono',
  void 0,
);
__decorate(
  [
    (0, mongoose_1.Prop)({
      type: mongoose_2.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    }),
    __metadata('design:type', role_schema_1.Role),
  ],
  Usuario.prototype,
  'rol',
  void 0,
);
__decorate(
  [(0, mongoose_1.Prop)({ default: true }), __metadata('design:type', Boolean)],
  Usuario.prototype,
  'activo',
  void 0,
);
exports.Usuario = Usuario = __decorate(
  [
    (0, mongoose_1.Schema)({
      timestamps: true,
      collection: 'personas',
    }),
  ],
  Usuario,
);
exports.UsuarioSchema = mongoose_1.SchemaFactory.createForClass(Usuario);
let CuentaApp = class CuentaApp extends mongoose_2.Document {};
exports.CuentaApp = CuentaApp;
__decorate(
  [
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata('design:type', String),
  ],
  CuentaApp.prototype,
  'nombre_usuario',
  void 0,
);
__decorate(
  [(0, mongoose_1.Prop)({ required: true }), __metadata('design:type', String)],
  CuentaApp.prototype,
  'contrase\u00F1a',
  void 0,
);
__decorate(
  [
    (0, mongoose_1.Prop)({
      type: mongoose_2.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    }),
    __metadata('design:type', Usuario),
  ],
  CuentaApp.prototype,
  'persona',
  void 0,
);
__decorate(
  [
    (0, mongoose_1.Prop)({
      type: [mongoose_2.Schema.Types.ObjectId],
      default: [],
    }),
    __metadata('design:type', Array),
  ],
  CuentaApp.prototype,
  'cuentas',
  void 0,
);
__decorate(
  [
    (0, mongoose_1.Prop)({
      type: mongoose_2.Schema.Types.ObjectId,
      default: null,
    }),
    __metadata('design:type', mongoose_2.Schema.Types.ObjectId),
  ],
  CuentaApp.prototype,
  'dispositivo_autorizado',
  void 0,
);
exports.CuentaApp = CuentaApp = __decorate(
  [
    (0, mongoose_1.Schema)({
      timestamps: true,
      collection: 'cuentas_app',
    }),
  ],
  CuentaApp,
);
exports.CuentaAppSchema = mongoose_1.SchemaFactory.createForClass(CuentaApp);
//# sourceMappingURL=usuario.schema.js.map
