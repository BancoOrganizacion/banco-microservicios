import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// ✅ Decorador personalizado para extraer datos del JWT
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si se especifica un campo específico, retornarlo
    if (data) {
      return user?.[data];
    }

    // Si no se especifica campo, retornar todo el objeto user
    return user;
  },
);

// ✅ Decorador específico para obtener el ID del usuario
export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Buscar el ID en diferentes campos posibles
    const userId = user?.id_usuario || user?.userId || user?.id || user?.sub;
    
    if (!userId) {
      throw new Error('ID de usuario no encontrado en el token JWT');
    }
    
    return userId;
  },
);