import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);
  
  constructor(private reflector: Reflector) {}
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    
    if (!request.user || !request.user.id_rol) {
      this.logger.warn('Solicitud sin información de rol de usuario');
      throw new ForbiddenException('No se encontró información de rol');
    }
    
    const hasPermission = requiredRoles.includes(request.user.id_rol);
    
    if (!hasPermission) {
      this.logger.warn(`Acceso denegado: Rol ${request.user.id_rol} no tiene permiso`);
      throw new ForbiddenException('No tienes permiso para acceder a este recurso');
    }
    
    return true;
  }
}