// api-gateway/src/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private jwtService: JwtService) {}

  // Este método simplemente extrae los datos del token sin hacer validación completa
  // La validación real se hace mediante la estrategia JWT y los guards
  extractTokenData(token: string): any {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return null;
      }
      
      const tokenValue = token.substring(7);
      return this.jwtService.decode(tokenValue);
    } catch (error) {
      this.logger.error(`Error al extraer datos del token: ${error.message}`);
      return null;
    }
  }

  // Verifica si el token es válido, usado en los interceptores
  verifyToken(token: string): boolean {
    try {
      if (!token || !token.startsWith('Bearer ')) {
        return false;
      }
      
      const tokenValue = token.substring(7);
      this.jwtService.verify(tokenValue);
      return true;
    } catch (error) {
      this.logger.error(`Token inválido: ${error.message}`);
      return false;
    }
  }
}