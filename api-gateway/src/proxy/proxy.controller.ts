// api-gateway/src/proxy/proxy.controller.ts
import { 
    Controller, 
    All, 
    Param, 
    Req, 
    Res, 
    HttpException, 
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { ProxyService } from './proxy.service';
  
  @Controller()
  export class ProxyController {
    private readonly logger = new Logger(ProxyController.name);
  
    constructor(private readonly proxyService: ProxyService) {}
  
    // Ruta para el servicio de autenticación
    @All('auth/*')
    async proxyToAuth(@Req() req: Request, @Res() res: Response) {
      return this.handleProxyRequest('auth', req, res);
    }
  
    // Ruta para el servicio de usuarios
    @All('users/*')
    async proxyToUsers(@Req() req: Request, @Res() res: Response) {
      return this.handleProxyRequest('users', req, res);
    }
  
    // Método general para manejar las solicitudes de proxy
    private async handleProxyRequest(service: string, req: Request, res: Response) {
      try {
        // Extraer la ruta específica del servicio (después de 'auth/' o 'users/')
        const path = req.url.split('/').slice(2).join('/');
        
        // Enviar la solicitud al microservicio correspondiente
        const result = await this.proxyService.forwardRequest(
          service,
          path,
          req.method,
          req.headers,
          req.body,
          req.query,
        );
        
        // Responder con el resultado del microservicio
        res.status(result.statusCode).json(result.data);
      } catch (error) {
        this.logger.error(`Error en proxy para ${service}: ${error.message}`);
        
        const status = error instanceof HttpException 
          ? error.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
          
        const message = error instanceof HttpException
          ? error.getResponse()
          : 'Error interno en el servidor';
          
        res.status(status).json({ 
          statusCode: status,
          message: message 
        });
      }
    }
  }