import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  
  getStatus() {
    return {
      status: 'online',
      service: 'usuarios-microservice',
      timestamp: new Date().toISOString(),
    };
  }


  getChao(): string {
    return 'BAY!';
  }
}
