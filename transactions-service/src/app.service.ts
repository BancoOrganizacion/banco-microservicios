import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'online',
      service: 'transactions-service',
      timestamp: new Date().toISOString(),
    };
  }
}
