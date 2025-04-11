import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, CuentaApp, UpdateUsuarioDto } from 'shared-models';
import { CreateUsuarioDto } from 'shared-models';
import { RolesService } from '../roles/roles.service';
import * as bcrypt from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<Usuario>,
    @InjectModel(CuentaApp.name) private cuentaAppModel: Model<CuentaApp>,
    private rolesService: RolesService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<any> {
    // Verificar si el rol existe
    const rolExiste = await this.rolesService.findOne(createUsuarioDto.rol);
    if (!rolExiste) {
      throw new NotFoundException(`Rol con ID ${createUsuarioDto.rol} no encontrado`);
    }

    // Verificar si el nombre de usuario ya existe
    const usuarioExistente = await this.cuentaAppModel.findOne({ 
      nombre_usuario: createUsuarioDto.nombre_usuario 
    });
    
    if (usuarioExistente) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Crear el usuario primero
    const { nombre_usuario, contraseña, ...usuarioData } = createUsuarioDto;
    const nuevoUsuario = new this.usuarioModel(usuarioData);
    const usuarioGuardado = await nuevoUsuario.save();

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // Crear la cuenta de aplicación asociada al usuario
    const nuevaCuentaApp = new this.cuentaAppModel({
      nombre_usuario,
      contraseña: hashedPassword,
      persona: usuarioGuardado._id,
      cuentas: [],
      dispositivo_autorizado: null
    });
    
    await nuevaCuentaApp.save();
    
    try {
      // Solicitar un token JWT al servicio de autenticación
      const token = await firstValueFrom(
        this.authClient.send('auth.generateTokenAfterRegistration', {
          username: nombre_usuario, 
          userId: usuarioGuardado._id.toString(),
          rolId: usuarioGuardado.rol.toString()
        })
      );
      
      return {
        usuario: usuarioGuardado,
        token: token.access_token
      };
    } catch (error) {
      console.error("Error al obtener token:", error);
      // Si falla la obtención del token, al menos retornamos el usuario creado
      return {
        usuario: usuarioGuardado,
        error: "No se pudo generar el token automáticamente"
      };
    }
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

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<{ mensaje: string }> {
    const usuarioActualizado = await this.usuarioModel
      .findByIdAndUpdate(id, updateUsuarioDto, { new: true })
      .exec();
  
    if (!usuarioActualizado) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  
    return { mensaje: 'Usuario actualizado con éxito' };
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

  async findByUsername(username: string) {
    let usuario = this.cuentaAppModel.findOne({ 
      nombre_usuario: username 
    }).populate({
      path:'persona',
      populate:{path:'rol'}
    })
    //console.log(usuario)
    return usuario
  }
  
}