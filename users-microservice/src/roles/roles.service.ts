import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>
  ) {
    // Crear roles por defecto si no existen
    this.createDefaultRoles();
  }

  private async createDefaultRoles() {
    const defaultRoles = [
      { nombre: 'admin', descripcion: 'Administrador del sistema' },
      { nombre: 'usuario', descripcion: 'Usuario estándar' },
    ];

    for (const role of defaultRoles) {
      const existingRole = await this.roleModel.findOne({ nombre: role.nombre }).exec();
      if (!existingRole) {
        await this.create(role);
      }
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const nuevoRole = new this.roleModel(createRoleDto);
    return nuevoRole.save();
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find({ activo: true }).exec();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const roleActualizado = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .exec();
    
    if (!roleActualizado) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    
    return roleActualizado;
  }
}