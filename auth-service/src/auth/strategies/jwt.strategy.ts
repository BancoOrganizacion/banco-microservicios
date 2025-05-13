import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { jwtConstants } from '../../config/jwt.config';
import { UsersClientService } from '../../users-client/users-client.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private usersClientService: UsersClientService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    this.logger.debug(`Validando token para usuario ID: ${payload.id_usuario}, Rol ID: ${payload.id_rol}`);
    
    try {
      // Usar el cliente de microservicios para obtener el usuario
      const usuario = await this.usersClientService.findOne(payload.id_usuario);

      if (!usuario) {
        this.logger.warn(`Usuario con ID ${payload.id_usuario} no encontrado durante la validación del token`);
        throw new UnauthorizedException('Usuario no válido');
      }

      // Verificar que el rol coincida con el del payload
      if (usuario.rol._id.toString() !== payload.id_rol) {
        this.logger.warn(`Rol del usuario ${payload.id_usuario} no coincide con el rol en el token`);
        throw new UnauthorizedException('Rol de usuario no válido');
      }

      // Devolvemos un objeto con id_usuario e id_rol
      return { 
        id_usuario: payload.id_usuario,
        id_rol: payload.id_rol
      };
    } catch (error) {
      this.logger.error(`Error al validar token: ${error.message}`);
      throw new UnauthorizedException('Error en la validación del token');
    }
  }
}