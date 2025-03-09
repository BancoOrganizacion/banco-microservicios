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
    const usuario = await this.usuariosService.findOne(payload.sub);
    
    if (!usuario) {
      throw new UnauthorizedException();
    }
    
    return { 
      userId: payload.sub, 
      username: payload.username,
      roles: payload.roles
    };
  }
}