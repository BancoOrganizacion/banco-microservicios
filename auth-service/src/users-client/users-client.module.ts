import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersClientService } from './users-client.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost', // O usa process.env.REDIS_HOST
          port: 6379, // O usa parseInt(process.env.REDIS_PORT)
        },
      },
    ]),
  ],
  providers: [UsersClientService],
  exports: [UsersClientService],
})
export class UsersClientModule {}