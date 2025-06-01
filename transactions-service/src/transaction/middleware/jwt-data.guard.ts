import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtDataGuard implements CanActivate {
  private readonly logger = new Logger(JwtDataGuard.name);
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    if (!request.user || !request.user.id_usuario) {
      this.logger.warn('Solicitud sin información de usuario');
      throw new UnauthorizedException('No se encontró información de autenticación');
    }
    
    return true;
  }
}