import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../../config/jwt.config';
import { UsuariosService } from '../../../../users-microservice/src/usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usuariosService: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    // Cambiado para usar 'userId' en lugar de 'sub' para que coincida con el payload generado
    const usuario = await this.usuariosService.findOne(payload.userId);

    if (!usuario) {
      throw new UnauthorizedException();
    }

    // Devolvemos un objeto con la misma estructura que el payload original
    return { 
      userId: payload.userId,
      username: payload.username
    };
  }
}