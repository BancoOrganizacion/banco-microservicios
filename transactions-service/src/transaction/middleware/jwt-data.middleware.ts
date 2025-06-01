import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class JwtDataMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtDataMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'];
    const roleId = req.headers['x-user-role'];

    if (userId && roleId) {
      req['user'] = {
        id_usuario: userId,
        id_rol: roleId
      };
      
      this.logger.debug(`Información del usuario extraída: ID=${userId}, Rol=${roleId}`);
    } else {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = require('jsonwebtoken').decode(token);
          
          if (decoded && decoded.id_usuario && decoded.id_rol) {
            req['user'] = {
              id_usuario: decoded.id_usuario,
              id_rol: decoded.id_rol
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