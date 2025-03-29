import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Body, 
    Param, 
    HttpStatus, 
    HttpException,
    NotFoundException
  } from '@nestjs/common';
  import { UsuariosService } from './usuarios.service';
  import { CreateUsuarioDto } from 'shared-models';
  import { UpdateUsuarioDto } from 'shared-models';
  import { UpdateUsuarioRolDto } from 'shared-models';
  import { MessagePattern } from '@nestjs/microservices';
  
  
  @Controller('usuarios')
  export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @MessagePattern('users.findByUsername')
    async findByUsername(data: { username: string }) {
      return this.usuariosService.findByUsername(data.username);
    }
  
    @MessagePattern('users.findOne')
    async findOneByMs(id: string) {
      return this.usuariosService.findOne(id);
    }
  
    @Post()
    async create(@Body() createUsuarioDto: CreateUsuarioDto) {
      try {
        return await this.usuariosService.create(createUsuarioDto);
      } catch (error) {
        if (error.code === 11000) {
          throw new HttpException(
            'El usuario con esta cédula o correo electrónico ya existe',
            HttpStatus.CONFLICT
          );
        }
        throw error;
      }
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      const usuario = await this.usuariosService.findOne(id);
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      return usuario;
    }
  
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
      try {
        const usuario = await this.usuariosService.update(id, updateUsuarioDto);
        if (!usuario) {
          throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return usuario;
      } catch (error) {
        if (error.code === 11000) {
          throw new HttpException(
            'El correo electrónico ya está en uso',
            HttpStatus.CONFLICT
          );
        }
        throw error;
      }
    }
  
    @Put(':id/rol')
    async updateRol(@Param('id') id: string, @Body() updateRolDto: UpdateUsuarioRolDto) {
      const usuario = await this.usuariosService.updateRol(id, updateRolDto.rolId);
      if (!usuario) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado o rol inválido`);
      }
      return usuario;
    }
  }