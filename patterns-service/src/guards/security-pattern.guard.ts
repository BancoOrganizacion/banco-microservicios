import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  BadRequestException,
  Logger 
} from '@nestjs/common';

@Injectable()
export class SecurityPatternGuard implements CanActivate {
  private readonly logger = new Logger(SecurityPatternGuard.name);
  
  // Maps para tracking de intentos
  private accountAttempts = new Map<string, { count: number, resetTime: number, lastAttempt: number }>();
  private ipAttempts = new Map<string, { count: number, resetTime: number }>();
  
  // Configuración de límites
  private readonly MAX_ATTEMPTS_PER_ACCOUNT = 5; // 5 intentos por cuenta por hora
  private readonly MAX_ATTEMPTS_PER_IP = 15; // 15 intentos por IP por hora
  private readonly RESET_INTERVAL = 60 * 60 * 1000; // 1 hora
  private readonly MIN_INTERVAL_BETWEEN_ATTEMPTS = 10 * 1000; // 10 segundos entre intentos por cuenta

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cuentaId = request.body?.cuentaId;
    const clientIp = this.getClientIp(request);
    
    if (!cuentaId) {
      throw new BadRequestException('CuentaId es requerido');
    }

    // Validar límites por cuenta
    if (!this.checkAccountLimit(cuentaId)) {
      this.logger.warn(`Rate limit excedido para cuenta: ${cuentaId}`);
      throw new BadRequestException(
        'Demasiados intentos para esta cuenta. Intente en 1 hora.'
      );
    }

    // Validar intervalo mínimo entre intentos para la misma cuenta
    if (!this.checkMinInterval(cuentaId)) {
      this.logger.warn(`Intervalo mínimo no respetado para cuenta: ${cuentaId}`);
      throw new BadRequestException(
        'Debe esperar al menos 10 segundos entre intentos para la misma cuenta.'
      );
    }

    // Validar límites por IP
    if (!this.checkIpLimit(clientIp)) {
      this.logger.warn(`Rate limit excedido para IP: ${clientIp}`);
      throw new BadRequestException(
        'Demasiados intentos desde esta dirección IP. Intente en 1 hora.'
      );
    }

    return true;
  }

  private checkAccountLimit(cuentaId: string): boolean {
    const now = Date.now();
    const attempt = this.accountAttempts.get(cuentaId);
    
    if (!attempt || now > attempt.resetTime) {
      // Reset o primer intento
      this.accountAttempts.set(cuentaId, { 
        count: 1, 
        resetTime: now + this.RESET_INTERVAL,
        lastAttempt: now
      });
      return true;
    }
    
    if (attempt.count >= this.MAX_ATTEMPTS_PER_ACCOUNT) {
      return false;
    }
    
    // Incrementar contador
    attempt.count++;
    attempt.lastAttempt = now;
    return true;
  }

  private checkMinInterval(cuentaId: string): boolean {
    const now = Date.now();
    const attempt = this.accountAttempts.get(cuentaId);
    
    if (!attempt) {
      return true; // Primer intento
    }
    
    return (now - attempt.lastAttempt) >= this.MIN_INTERVAL_BETWEEN_ATTEMPTS;
  }

  private checkIpLimit(ip: string): boolean {
    const now = Date.now();
    const attempt = this.ipAttempts.get(ip);
    
    if (!attempt || now > attempt.resetTime) {
      this.ipAttempts.set(ip, { 
        count: 1, 
        resetTime: now + this.RESET_INTERVAL 
      });
      return true;
    }
    
    if (attempt.count >= this.MAX_ATTEMPTS_PER_IP) {
      return false;
    }
    
    attempt.count++;
    return true;
  }

  private getClientIp(request: any): string {
    return request.ip || 
           request.connection?.remoteAddress || 
           request.socket?.remoteAddress ||
           (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           '0.0.0.0';
  }

  // Método para limpiar intentos antiguos (opcional, para optimización de memoria)
  cleanupOldAttempts() {
    const now = Date.now();
    
    // Limpiar intentos de cuentas expirados
    for (const [key, value] of this.accountAttempts.entries()) {
      if (now > value.resetTime) {
        this.accountAttempts.delete(key);
      }
    }
    
    // Limpiar intentos de IPs expirados
    for (const [key, value] of this.ipAttempts.entries()) {
      if (now > value.resetTime) {
        this.ipAttempts.delete(key);
      }
    }
  }
}