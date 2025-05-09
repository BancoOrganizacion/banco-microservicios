import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('status')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Probar el servicio de autenticación' })
  @ApiOkResponse({
    description: 'Resultado de la prueba',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Auth service is working!' },
        data: { type: 'object' },
      },
    },
  })
  @MessagePattern({ cmd: 'test' })
  async test(data: any) {
    return { message: 'Auth service is working!', data };
  }
}
