import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('gateway')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verificar el estado del API Gateway' })
  @ApiOkResponse({
    description: 'Estado del servicio',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'online' },
        service: { type: 'string', example: 'api-gateway' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }
}
