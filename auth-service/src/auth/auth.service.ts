import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegistrationCode } from './schemas/registration-code.schema';
import { UsuariosService } from '../../../users-microservice/src/usuarios/usuarios.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(RegistrationCode.name) private registrationCodeModel: Model<RegistrationCode>,
    private jwtService: JwtService,
    private usuariosService: UsuariosService,
    private telegramService: TelegramService,
  ) {}

  async validateUser(username: string, password: string): Promise<string> {
    // Obtener el usuario y su cuenta de la base de datos
    this.logger.debug(`Buscando usuario ${username}`);
    const cuenta = await this.usuariosService.findByUsername(username);

    if (!cuenta) {
      this.logger.warn(`Cuenta no válida para usuario: ${username}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, cuenta.contraseña);

    if (!isPasswordValid) {
      this.logger.warn(`Contraseña no válida para usuario: ${username}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const userId = cuenta.persona._id.toString();
    this.logger.debug(`ID del usuario: ${userId}`);

    // Creamos el payload asegurándonos de que userId esté definido
    const payload = { 
      username: cuenta.nombre_usuario, 
      userId: userId
    };

    // Registrar el payload para depuración
    this.logger.debug(`Payload del token: ${JSON.stringify(payload)}`);
    
    // Generar el token JWT
    const token = this.jwtService.sign(payload);
    
    // Verificar el token decodificado para asegurarnos que contiene el userId
    const decoded = this.jwtService.decode(token);
    this.logger.debug(`Token decodificado: ${JSON.stringify(decoded)}`);
    
    return token;
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

    // Intentar enviar el código por Telegram si el usuario tiene número de teléfono
    if (usuario.telefono) {
      try {
        // Convertir el teléfono ecuatoriano a un formato que Telegram pueda manejar
        // Asumiendo que el formato es 0912345678, necesitamos convertirlo a 593912345678
        // Quitamos el 0 inicial y añadimos el código de país 593
        const telegramPhone = `593${usuario.telefono.substring(1)}`;
        
        // Tratar de enviar el mensaje (esto podría fallar si el usuario no ha iniciado una conversación con el bot)
        await this.telegramService.sendVerificationCode(telegramPhone, code);
        this.logger.log(`Código de verificación enviado a ${telegramPhone} por Telegram`);
      } catch (error) {
        this.logger.error(`Error al enviar código por Telegram: ${error.message}`);
        // No lanzamos excepción aquí, para que la API siga funcionando
        // incluso si hay un problema con Telegram
      }
    } else {
      this.logger.warn(`Usuario ${userId} no tiene número de teléfono registrado para enviar código por Telegram`);
    }

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