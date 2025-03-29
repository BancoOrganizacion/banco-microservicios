// users-microservice/src/usuarios/usuarios.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  HttpStatus, 
  HttpException,
  NotFoundException,
  UseGuards,
  Request,
  Logger
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from 'shared-models';
import { UpdateUsuarioDto } from 'shared-models';
import { UpdateUsuarioRolDto } from 'shared-models';
import { MessagePattern } from '@nestjs/microservices';
import { JwtDataGuard } from '../common/guards/jwt-data.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('usuarios')
export class UsuariosController {
  private readonly logger = new Logger(UsuariosController.name);

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

  // Endpoint protegido: sólo admins o el propio usuario pueden ver su información
  @UseGuards(JwtDataGuard, RoleGuard)
  @Roles('ID_ROL_ADMIN') // Ajusta esto según los IDs de tus roles
  @Get()
  async findAll() {
    this.logger.debug('Obteniendo lista de todos los usuarios');
    return this.usuariosService.findAll();
  }

  // Endpoint protegido: permite a un usuario ver su propio perfil o a admin ver cualquier perfil
  @UseGuards(JwtDataGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Solicitando información del usuario ${id}`);
    
    // Verificar si el usuario está solicitando su propio perfil o es admin
    const userId = req.user.id_usuario;
    const userRoleId = req.user.id_rol;
    
    // Si no es el propio usuario ni un administrador, denegar acceso
    // Nota: deberás ajustar 'ID_ROL_ADMIN' al ID real de tu rol de administrador
    if (id !== userId && userRoleId !== 'ID_ROL_ADMIN') {
      this.logger.warn(`Usuario ${userId} intentó acceder al perfil de ${id}`);
      throw new HttpException('No tienes permiso para ver este perfil', HttpStatus.FORBIDDEN);
    }
    
    const usuario = await this.usuariosService.findOne(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  // Endpoint protegido: permite a un usuario actualizar su propio perfil o a admin actualizar cualquier perfil
  @UseGuards(JwtDataGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req) {
    try {
      const userId = req.user.id_usuario;
      const userRoleId = req.user.id_rol;
      
      // Si no es el propio usuario ni un administrador, denegar acceso
      if (id !== userId && userRoleId !== 'ID_ROL_ADMIN') {
        throw new HttpException('No tienes permiso para actualizar este perfil', HttpStatus.FORBIDDEN);
      }
      
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

  // Endpoint protegido: sólo admins pueden actualizar roles
  @UseGuards(JwtDataGuard, RoleGuard)
  @Roles('ID_ROL_ADMIN')
  @Put(':id/rol')
  async updateRol(@Param('id') id: string, @Body() updateRolDto: UpdateUsuarioRolDto) {
    const usuario = await this.usuariosService.updateRol(id, updateRolDto.rolId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado o rol inválido`);
    }
    return usuario;
  }
}