// api-gateway/src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'online',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }
}