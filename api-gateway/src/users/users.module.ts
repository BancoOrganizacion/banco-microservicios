import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';


@Module({
    imports: [
      ClientsModule.register([
        {
          name: 'USERS_SERVICE',
          transport: Transport.RMQ,
          options: {
            urls: ['amqp://localhost:5672'],
            queue: 'users_queue',
            queueOptions: {
              durable: false
            },
          },
        },
      ]),
    ],
    controllers: [UsersController],
    providers: [UsersService],
  })
export class UsersModule {}
