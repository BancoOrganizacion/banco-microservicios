import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersClientService {
  private readonly logger = new Logger(UsersClientService.name);

  constructor(@Inject('USERS_SERVICE') private readonly client: ClientProxy) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('Conexión establecida con el microservicio de usuarios');
    } catch (error) {
      this.logger.error(
        `Error al conectar con el microservicio de usuarios: ${error.message}`,
      );
    }
  }

  async findByUsername(username: string) {
    this.logger.debug(`Buscando usuario por nombre de usuario: ${username}`);
    try {
      return await firstValueFrom(
        this.client.send('users.findByUsername', { username }),
      );
    } catch (error) {
      this.logger.error(
        `Error al buscar usuario por username: ${error.message}`,
      );
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.debug(`Buscando usuario por ID: ${id}`);
    try {
      return await firstValueFrom(this.client.send('users.findOne', id));
    } catch (error) {
      this.logger.error(`Error al buscar usuario por ID: ${error.message}`);
      throw error;
    }
  }
}
