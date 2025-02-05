import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  @MessagePattern({ cmd: 'test' })
  async test(data: any) {
    return { message: 'Auth service is working!', data };
  }
}
