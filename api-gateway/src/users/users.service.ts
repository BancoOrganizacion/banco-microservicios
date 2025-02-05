import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  async test() {
    return firstValueFrom(
      this.usersClient.send({ cmd: 'test_users' }, { timestamp: new Date() })
    );
  }
}
