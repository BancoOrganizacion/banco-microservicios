// users-microservice/src/roles/roles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  HttpStatus,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from 'shared-models';
import { UpdateRoleDto } from 'shared-models';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Crear un nuevo rol' })
  @ApiBody({ type: CreateRoleDto })
  @ApiCreatedResponse({
    description: 'Rol creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6070f06d5c7b1a1a9c9b0b3a' },
        nombre: { type: 'string', example: 'admin' },
        descripcion: { type: 'string', example: 'Administrador del sistema' },
        activo: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiConflictResponse({ description: 'El rol con este nombre ya existe' })
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      return await this.rolesService.create(createRoleDto);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          'El rol con este nombre ya existe',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Obtener todos los roles activos' })
  @ApiOkResponse({
    description: 'Lista de roles',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          activo: { type: 'boolean' },
        },
      },
    },
  })
  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Obtener rol por ID' })
  @ApiParam({ name: 'id', description: 'ID del rol', type: 'string' })
  @ApiOkResponse({
    description: 'Rol encontrado',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        nombre: { type: 'string' },
        descripcion: { type: 'string' },
        activo: { type: 'boolean' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const role = await this.rolesService.findOne(id);
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return role;
  }

  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiParam({ name: 'id', description: 'ID del rol', type: 'string' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({
    description: 'Rol actualizado',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        nombre: { type: 'string' },
        descripcion: { type: 'string' },
        activo: { type: 'boolean' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  @ApiConflictResponse({ description: 'El nombre del rol ya está en uso' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.rolesService.update(id, updateRoleDto);
      if (!role) {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }
      return role;
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          'El nombre del rol ya está en uso',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }
}
