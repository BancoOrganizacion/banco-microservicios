// users-microservice/src/common/guards/role.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);
  
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService
  ) {}
  
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
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
    
    // El rol del usuario actual
    const userRoleId = request.user.id_rol;
    
    try {
      // Obtener el rol desde la base de datos
      const role = await this.rolesService.findOne(userRoleId);
      
      this.logger.debug(`Verificando permiso: rol del usuario ${role.nombre} (${userRoleId}), roles requeridos ${JSON.stringify(requiredRoles)}`);
      
      // Comprobar si el nombre del rol coincide con alguno de los roles requeridos
      const hasPermission = requiredRoles.some(requiredRole => {
        // Si el requerido es un ID de MongoDB y coincide con el ID del rol
        if (requiredRole === userRoleId) return true;
        
        // Si el requerido es el string 'admin' y el nombre del rol es 'admin'
        if (requiredRole.toLowerCase() === 'admin' && role.nombre.toLowerCase() === 'admin') return true;
        
        // Si el requerido es ID_ROL_ADMIN y el nombre del rol es 'admin'
        if (requiredRole === 'ID_ROL_ADMIN' && role.nombre.toLowerCase() === 'admin') return true;
        
        return false;
      });
      
      if (!hasPermission) {
        this.logger.warn(`Acceso denegado: Rol ${role.nombre} (${userRoleId}) no tiene permiso para acceder a un recurso que requiere ${requiredRoles.join(', ')}`);
        throw new ForbiddenException('No tienes permiso para acceder a este recurso');
      }
      
      return true;
      
    } catch (error) {
      // Si ocurre un error al buscar el rol (por ejemplo, rol no encontrado)
      this.logger.error(`Error al verificar rol: ${error.message}`);
      
      // Verificación alternativa basada solo en IDs
      if (process.env.ADMIN_ROLE_ID && process.env.ADMIN_ROLE_ID === userRoleId) {
        return true;
      }
      
      throw new ForbiddenException('No tienes permiso para acceder a este recurso');
    }
  }
}