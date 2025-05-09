import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'online',
      service: 'accounts-service',
      timestamp: new Date().toISOString(),
    };
  }
}
