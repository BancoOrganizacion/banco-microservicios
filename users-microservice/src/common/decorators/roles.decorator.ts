// users-microservice/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

// El decorador puede recibir strings (nombres de roles) o IDs de MongoDB
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Constantes para roles comunes
export const ROLE_ADMIN = 'admin';
export const ROLE_USER = 'usuario';