import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class JwtDataGuard implements CanActivate {
    private readonly logger = new Logger(JwtDataGuard.name);

    constructor(private readonly jwtService: JwtService) { } // Inyecta JwtService

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest() as any;
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            this.logger.warn('No se encontró token JWT en la solicitud');
            throw new UnauthorizedException('Token no proporcionado');
        }

        try {
            const payload = this.jwtService.verify(token); // Verifica y decodifica el token
            request.user = payload; // Asigna el payload a request.user
            return true;
        } catch (error) {
            this.logger.error('Token JWT inválido', error.stack);
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}