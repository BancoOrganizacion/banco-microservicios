// api-gateway/src/proxy/proxy.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    AuthModule,
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}