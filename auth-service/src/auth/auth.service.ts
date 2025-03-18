import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegistrationCode } from './schemas/registration-code.schema';
import { UsuariosService } from '../../../users-microservice/src/usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(RegistrationCode.name) private registrationCodeModel: Model<RegistrationCode>,
    private jwtService: JwtService,
    private usuariosService: UsuariosService,
  ) {}

  async validateUser(username: string, password: string): Promise<string> {
    // Obtener el usuario y su cuenta de la base de datos
    console.log(`Buscando usuario`);
    const cuenta = await this.usuariosService.findByUsername(username);
    console.log(cuenta)

    if (!cuenta) {
      console.log("cuenta no valida")
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, cuenta.contraseña);

    if (!isPasswordValid) {
      // Opcional: incrementar contador de intentos fallidos
      console.log("clave no valida")
      throw new UnauthorizedException('Credenciales inválidas');
    }

    

    const userId = cuenta.persona._id.toString();
    console.log("ID del usuario:", userId);

    const payload = { 
      username: cuenta.nombre_usuario, 
      userId: userId // Solo el ID del usuario como string
    };

    console.log("Payload final:", payload);
    return this.jwtService.sign(payload);
  }

  async generateRegistrationCode(userId: string, tipo: string): Promise<string> {
    // Verificar si el usuario existe
    const usuario = await this.usuariosService.findOne(userId);

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Generar código de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Establecer expiración (15 minutos)
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 15);

    // Guardar código en la base de datos
    const nuevoRegistro = new this.registrationCodeModel({
      usuario: userId,
      codigo: code,
      tipo,
      expiracion,
      usado: false
    });

    await nuevoRegistro.save();

    return code;
  }

  async validateRegistrationCode(userId: string, code: string): Promise<boolean> {
    // Buscar el código más reciente para el usuario que no haya sido usado
    const registrationCode = await this.registrationCodeModel.findOne({
      usuario: userId,
      codigo: code,
      usado: false,
      expiracion: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!registrationCode) {
      return false;
    }

    // Marcar el código como usado
    registrationCode.usado = true;
    await registrationCode.save();

    return true;
  }
}