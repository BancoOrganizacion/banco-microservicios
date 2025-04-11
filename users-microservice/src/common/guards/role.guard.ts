// users-microservice/src/common/guards/role.guard.ts
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
    // Obtener los roles permitidos para este endpoint
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // Si no hay roles definidos, permitir acceso
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    
    // Verificar si existe información del usuario y rol
    if (!request.user || !request.user.id_rol) {
      this.logger.warn('Solicitud sin información de rol de usuario');
      throw new ForbiddenException('No se encontró información de rol');
    }
    
    // Aquí deberías implementar la lógica para verificar si el rol del usuario
    // está en la lista de roles permitidos. Esto dependerá de cómo manejas los roles
    // en tu aplicación (por ID, por nombre, etc.)
    
    // Ejemplo simple: el id_rol debe estar en la lista de roles requeridos
    const hasPermission = requiredRoles.includes(request.user.id_rol);
    
    if (!hasPermission) {
      this.logger.warn(`Acceso denegado: Rol ${request.user.id_rol} no tiene permiso`);
      throw new ForbiddenException('No tienes permiso para acceder a este recurso');
    }
    
    return true;
  }
}