import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verificar el estado del servicio de usuarios' })
  @ApiOkResponse({
    description: 'Estado del servicio',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'online' },
        service: { type: 'string', example: 'usuarios-microservice' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }

  @ApiOperation({ summary: 'Endpoint de prueba' })
  @ApiOkResponse({
    description: 'Mensaje de despedida',
    schema: {
      type: 'string',
      example: 'BAY!',
    },
  })
  @Get('/chao')
  getChao(): string {
    return this.appService.getChao();
  }
}
