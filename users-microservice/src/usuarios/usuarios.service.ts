import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario } from './schemas/usuario.schema';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    private rolesService: RolesService
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Verificar si el rol existe
    const rolExiste = await this.rolesService.findOne(createUsuarioDto.rol);
    if (!rolExiste) {
      throw new NotFoundException(`Rol con ID ${createUsuarioDto.rol} no encontrado`);
    }

    const nuevoUsuario = new this.usuarioModel(createUsuarioDto);
    return nuevoUsuario.save();
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioModel.find().populate('rol').exec();
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioModel.findById(id).populate('rol').exec();
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(id, updateUsuarioDto, { new: true })
      .populate('rol')
      .exec();
    
    if (!usuarioActualizado) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    
    return usuarioActualizado;
  }

  async updateRol(usuarioId: string, rolId: string): Promise<Usuario> {
    // Verificar si el rol existe
    const rolExiste = await this.rolesService.findOne(rolId);
    if (!rolExiste) {
      throw new NotFoundException(`Rol con ID ${rolId} no encontrado`);
    }

    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(
        usuarioId, 
        { rol: rolId },
        { new: true }
      )
      .populate('rol')
      .exec();
    
    if (!usuarioActualizado) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }
    
    return usuarioActualizado;
  }
}