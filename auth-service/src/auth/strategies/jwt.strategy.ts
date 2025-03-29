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
    this.logger.debug(`Validando token para usuario: ${payload.username}, ID: ${payload.userId}`);
    
    try {
      // Usar el cliente de microservicios para obtener el usuario
      const usuario = await this.usersClientService.findOne(payload.userId);

      if (!usuario) {
        this.logger.warn(`Usuario con ID ${payload.userId} no encontrado durante la validación del token`);
        throw new UnauthorizedException('Usuario no válido');
      }

      // Devolvemos un objeto con la misma estructura que el payload original
      return { 
        userId: payload.userId,
        username: payload.username
      };
    } catch (error) {
      this.logger.error(`Error al validar token: ${error.message}`);
      throw new UnauthorizedException('Error en la validación del token');
    }
  }
}