import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Put,
    HttpStatus, 
    HttpException,
    NotFoundException
  } from '@nestjs/common';
  import { RolesService } from './roles.service';
  import { CreateRoleDto } from './dto/create-role.dto';
  import { UpdateRoleDto } from './dto/update-role.dto';
  @Controller('roles')
  export class RolesController {
    constructor(private readonly rolesService: RolesService) {}
  
    @Post()
    async create(@Body() createRoleDto: CreateRoleDto) {
      try {
        return await this.rolesService.create(createRoleDto);
      } catch (error) {
        if (error.code === 11000) {
          throw new HttpException(
            'El rol con este nombre ya existe',
            HttpStatus.CONFLICT
          );
        }
        throw error;
      }
    }
  
    @Get()
    async findAll() {
      return this.rolesService.findAll();
    }
  
    @Get(':id')
    async findOne(@Param('id') id: string) {
      const role = await this.rolesService.findOne(id);
      if (!role) {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }
      return role;
    }
  
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
            HttpStatus.CONFLICT
          );
        }
        throw error;
      }
    }
  }