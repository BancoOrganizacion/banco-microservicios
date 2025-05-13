import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verificar el estado del servicio de cuentas' })
  @ApiOkResponse({ 
    description: 'Estado del servicio',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'online' },
        service: { type: 'string', example: 'accounts-service' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }
}