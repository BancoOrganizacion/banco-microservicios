import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly serviceUrls: Record<string, string>;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // Configurar las URLs de los microservicios
    this.serviceUrls = {
      auth: configService.get('AUTH_SERVICE_URL', 'http://localhost:3002'),
      users: configService.get('USERS_SERVICE_URL', 'http://localhost:3001'),
      accounts: configService.get('ACCOUNTS_SERVICE_URL', 'http://localhost:3003'),
      fingerprints: configService.get('FINGERPRINT_SERVICE_URL','http://localhost:3008'),
      patterns: configService.get('PATTERNS_SERVICE_URL','http://localhost:3009/patterns'),
      transactions: configService.get('TRANSACTIONS_SERVICE_URL','http://localhost:3004'), // NUEVO
    };
  }
s
  async forwardRequest(
    service: string,
    path: string,
    method: string,
    headers: any,
    body: any,
    query: any,
  ): Promise<any> {
    const serviceUrl = this.serviceUrls[service];
    
    if (!serviceUrl) {
      throw new HttpException(`Servicio ${service} no encontrado`, HttpStatus.NOT_FOUND);
    }
  
    // Modificar la ruta para el endpoint de perfil propio
    let actualPath = path;
    if (service === 'users' && path === 'usuarios/perfil' && method === 'PUT') {
      const tokenData = this.authService.extractTokenData(headers.authorization);
      if (!tokenData || !tokenData.id_usuario) {
        throw new HttpException('Token inválido o expirado', HttpStatus.UNAUTHORIZED);
      }
      // Reemplazar la ruta con la ID del usuario del token
      actualPath = `usuarios/${tokenData.id_usuario}`;
    }
  
    // Caso especial para crear cuenta: si no se proporciona titular, usar el ID del usuario actual
    if (service === 'accounts' && path === 'cuentas' && method === 'POST') {
      const tokenData = this.authService.extractTokenData(headers.authorization);
      if (tokenData && tokenData.id_usuario && !body.titular) {
        // Si no hay titular especificado, usar el ID del usuario actual
        body.titular = tokenData.id_usuario;
      }
    }
  
    const fullUrl = `${serviceUrl}/${path}`;
    this.logger.debug(`Redirigiendo solicitud a: ${method} ${fullUrl}`);
  
    // Preparar configuración para la solicitud
    const requestConfig: AxiosRequestConfig = {
      url: fullUrl,
      method: method,
      headers: this.prepareHeaders(headers),
      params: query,
      data: body,
    };
  
    try {
      // Solo verificar el token si existe en los headers
      if (headers.authorization) {
        // Si el token es inválido, esto lanzará una excepción
        const isValidToken = this.authService.verifyToken(headers.authorization);
        if (!isValidToken) {
          throw new HttpException('Token inválido o expirado', HttpStatus.UNAUTHORIZED);
        }
  
        // Extraer información del token para el microservicio
        const tokenData = this.authService.extractTokenData(headers.authorization);
        
        // Agregar información del usuario en los headers para los microservicios
        if (tokenData) {
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers['X-User-Id'] = tokenData.id_usuario;
          requestConfig.headers['X-User-Role'] = tokenData.id_rol;
        }
      }
  
      const response = await firstValueFrom(this.httpService.request(requestConfig));
      return {
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Error al redirigir solicitud: ${error.message}`);
      
      // Manejar errores de los microservicios
      if (error.response) {
        const { status, data } = error.response;
        throw new HttpException(data, status);
      }
      
      throw new HttpException(
        'Error al comunicarse con el microservicio',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private prepareHeaders(headers: any): any {
    // Copiar headers relevantes, excluir host, connection, etc.
    const result = { ...headers };
    
    // Eliminar headers específicos que no se deben reenviar
    delete result.host;
    delete result.connection;
    delete result['content-length'];
    
    return result;
  }
}