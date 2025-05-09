import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JwtDataMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtDataMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Comprobamos si tenemos los headers personalizados del API Gateway
    const userId = req.headers['x-user-id'];
    const roleId = req.headers['x-user-role'];

    if (userId && roleId) {
      // Si tenemos los headers, añadimos la información al objeto request
      req['user'] = {
        id_usuario: userId,
        id_rol: roleId,
      };

      this.logger.debug(
        `Información del usuario extraída: ID=${userId}, Rol=${roleId}`,
      );
    } else {
      // Si no tenemos los headers, podemos intentar extraerlos del JWT directamente
      // (esto sería un fallback en caso de que no estemos usando el API Gateway)
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
          // Solo decodificamos el token sin verificar la firma
          // ya que asumimos que el API Gateway ya lo hizo
          const decoded = require('jsonwebtoken').decode(token);

          if (decoded && decoded.id_usuario && decoded.id_rol) {
            req['user'] = {
              id_usuario: decoded.id_usuario,
              id_rol: decoded.id_rol,
            };

            this.logger.debug(`Información del usuario extraída del JWT`);
          }
        } catch (error) {
          this.logger.error(`Error al decodificar el token: ${error.message}`);
        }
      }
    }

    next();
  }
}
