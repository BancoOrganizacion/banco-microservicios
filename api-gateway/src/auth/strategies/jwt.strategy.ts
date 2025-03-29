// api-gateway/src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'secretKey'),
    });
  }

  async validate(payload: any) {
    this.logger.debug(`Validando token en API Gateway: ${JSON.stringify(payload)}`);
    
    // Solo verificamos que el payload tenga los campos necesarios
    if (!payload.id_usuario || !payload.id_rol) {
      return false;
    }
    
    // Devolvemos el payload para que esté disponible en el Request
    return { 
      id_usuario: payload.id_usuario,
      id_rol: payload.id_rol
    };
  }
}