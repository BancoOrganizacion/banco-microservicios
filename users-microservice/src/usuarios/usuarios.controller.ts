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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  private readonly logger = new Logger(UsuariosController.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  // Los endpoints MessagePattern no se documentan con Swagger ya que son internos
  @MessagePattern('users.findByUsername')
  async findByUsername(data: { username: string }) {
    return this.usuariosService.findByUsername(data.username);
  }

  @MessagePattern('users.findOne')
  async findOneByMs(id: string) {
    return this.usuariosService.findOne(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUsuarioDto })
  @ApiCreatedResponse({ 
    description: 'Usuario creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        usuario: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            nombre: { type: 'string' },
            apellido: { type: 'string' },
            cedula: { type: 'string' },
            email: { type: 'string' },
            telefono: { type: 'string' },
            rol: { 
              type: 'object',
              properties: {
                _id: { type: 'string' },
                nombre: { type: 'string' }
              }
            },
            activo: { type: 'boolean' }
          }
        },
        token: { 
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  @ApiConflictResponse({ description: 'El usuario con esta cédula o correo electrónico ya existe' })
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

  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ 
    description: 'Lista de usuarios',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          cedula: { type: 'string' },
          email: { type: 'string' },
          telefono: { type: 'string' },
          rol: { 
            type: 'object',
            properties: {
              _id: { type: 'string' },
              nombre: { type: 'string' }
            }
          },
          activo: { type: 'boolean' }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso denegado' })
  @UseGuards(JwtDataGuard, RoleGuard)
  @Roles('ID_ROL_ADMIN')
  @Get()
  async findAll() {
    this.logger.debug('Obteniendo lista de todos los usuarios');
    return this.usuariosService.findAll();
  }

  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ 
    description: 'Usuario encontrado',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        nombre: { type: 'string' },
        apellido: { type: 'string' },
        cedula: { type: 'string' },
        email: { type: 'string' },
        telefono: { type: 'string' },
        rol: { 
          type: 'object',
          properties: {
            _id: { type: 'string' },
            nombre: { type: 'string' }
          }
        },
        activo: { type: 'boolean' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para ver este perfil' })
  @UseGuards(JwtDataGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Solicitando información del usuario ${id}`);
    
    // Verificar si el usuario está solicitando su propio perfil o es admin
    const userId = req.user.id_usuario;
    const userRoleId = req.user.id_rol;
    
    // Si no es el propio usuario ni un administrador, denegar acceso
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

  // Para actualizar un usario
  @ApiOperation({ summary: 'Actualizar perfil propio' })
  @ApiBody({ type: UpdateUsuarioDto })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ 
    description: 'Perfil actualizado'
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @UseGuards(JwtDataGuard)
  @Put('perfil')
  async updateProfile(@Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req) {
    const userId = req.user.id_usuario;
    return this.usuariosService.update(userId, updateUsuarioDto);
  }

  //////////////////
  @ApiOperation({ summary: 'Actualizar rol de usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'string' })
  @ApiBody({ type: UpdateUsuarioRolDto })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ 
    description: 'Rol de usuario actualizado',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        nombre: { type: 'string' },
        apellido: { type: 'string' },
        cedula: { type: 'string' },
        email: { type: 'string' },
        telefono: { type: 'string' },
        rol: { 
          type: 'object',
          properties: {
            _id: { type: 'string' },
            nombre: { type: 'string' }
          }
        },
        activo: { type: 'boolean' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado o rol inválido' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  @ApiForbiddenResponse({ description: 'Acceso denegado' })
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