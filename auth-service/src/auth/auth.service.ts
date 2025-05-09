import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RegistrationCode } from 'shared-models';
import { UsersClientService } from '../users-client/users-client.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(RegistrationCode.name)
    private registrationCodeModel: Model<RegistrationCode>,
    private jwtService: JwtService,
    private usersClientService: UsersClientService,
    private telegramService: TelegramService,
  ) {}

  async validateUser(username: string, password: string): Promise<string> {
    // Obtener el usuario a través del cliente de microservicio
    this.logger.debug(`Buscando usuario ${username}`);
    const cuenta = await this.usersClientService.findByUsername(username);

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
    const rolId = cuenta.persona.rol._id.toString();

    this.logger.debug(`ID del usuario: ${userId}, ID del rol: ${rolId}`);

    // Creamos el payload solo con id_usuario y id_rol
    const payload = {
      id_usuario: userId,
      id_rol: rolId,
    };

    // Registrar el payload para depuración
    this.logger.debug(`Payload del token: ${JSON.stringify(payload)}`);

    // Generar el token JWT
    const token = this.jwtService.sign(payload);

    // Verificar el token decodificado para asegurarnos que contiene los IDs correctos
    const decoded = this.jwtService.decode(token);
    this.logger.debug(`Token decodificado: ${JSON.stringify(decoded)}`);

    return token;
  }

  // Método para descifrar el token y obtener id_usuario e id_rol
  decodeToken(token: string): { id_usuario: string; id_rol: string } {
    try {
      // Verificar y descifrar el token
      const payload = this.jwtService.verify(token);

      // Verificar que el payload tenga la estructura esperada
      if (!payload.id_usuario || !payload.id_rol) {
        throw new UnauthorizedException(
          'Token inválido: estructura de payload incorrecta',
        );
      }

      return {
        id_usuario: payload.id_usuario,
        id_rol: payload.id_rol,
      };
    } catch (error) {
      this.logger.error(`Error al descifrar token: ${error.message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async generateRegistrationCode(
    userId: string,
    tipo: string,
  ): Promise<string> {
    await this.cleanupExpiredCodes();
    // Verificar si el usuario existe usando el cliente
    const usuario = await this.usersClientService.findOne(userId);

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // El resto del código permanece igual
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 1);

    const nuevoRegistro = new this.registrationCodeModel({
      usuario: userId,
      codigo: code,
      tipo,
      expiracion,
      usado: false,
    });

    await nuevoRegistro.save();

    try {
      const result = await this.telegramService.sendVerificationCodeByUserId(
        userId,
        code,
      );

      if (result) {
        this.logger.log(
          `Código de verificación enviado al usuario ${userId} por Telegram`,
        );
      } else {
        this.logger.warn(
          `No se pudo enviar el código por Telegram al usuario ${userId}. El usuario no tiene Telegram vinculado.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al enviar código por Telegram: ${error.message}`,
      );
    }

    return code;
  }

  async validateRegistrationCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    // Este método no requiere cambios
    await this.cleanupExpiredCodes();

    const registrationCode = await this.registrationCodeModel
      .findOne({
        usuario: userId,
        codigo: code,
        usado: false,
        expiracion: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (!registrationCode) {
      return false;
    }

    registrationCode.usado = true;
    await registrationCode.save();

    return true;
  }

  async generateTokenForNewUser(
    userId: string,
    rolId: string,
  ): Promise<string> {
    try {
      // Creamos el payload solo con id_usuario y id_rol (similar a validateUser)
      const payload = {
        id_usuario: userId,
        id_rol: rolId,
      };

      this.logger.debug(
        `Generando token para usuario nuevo: ID=${userId}, Rol=${rolId}`,
      );

      // Generar el token JWT
      const token = this.jwtService.sign(payload);
      return token;
    } catch (error) {
      this.logger.error(
        `Error al generar token para usuario nuevo: ${error.message}`,
      );
      throw error;
    }
  }

  async cleanupExpiredCodes(userId?: string): Promise<number> {
    const query = {
      $or: [{ expiracion: { $lt: new Date() } }, { usado: true }],
    };

    // Si se proporciona userId, filtrar solo por ese usuario
    if (userId) {
      query['usuario'] = userId;
    }

    const result = await this.registrationCodeModel.deleteMany(query);

    this.logger.log(
      `Se eliminaron ${result.deletedCount} códigos expirados o usados`,
    );
    return result.deletedCount;
  }
  async getUserIdFromCode(code: string): Promise<ObjectId | null> {
    // Limpiar códigos expirados primero
    await this.cleanupExpiredCodes();

    // Buscar el código activo más reciente
    const registrationCode = await this.registrationCodeModel
      .findOne({
        codigo: code,
        usado: false,
        expiracion: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    // Si no encontramos un código válido, retornar null
    if (!registrationCode) {
      return null;
    }

    // Retornar el ID del usuario asociado al código
    return registrationCode.usuario;
  }
}
