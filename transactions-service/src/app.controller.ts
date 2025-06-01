import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Verificar el estado del servicio de transacciones' })
  @ApiOkResponse({ description: 'Estado del servicio' })
  @Get()
  getStatus() {
    return this.appService.getStatus();
  }
}