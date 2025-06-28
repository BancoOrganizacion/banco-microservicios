import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CuentaApp, PatronAutenticacion } from 'shared-models';
import { DedoPatron } from 'shared-models';

@Injectable()
export class PatternService {
  constructor(
    @InjectModel(PatronAutenticacion.name)
    private readonly patronAutenticacionModel: Model<PatronAutenticacion>,
    @InjectModel(DedoPatron.name)
    private readonly dedoPatronModel: Model<DedoPatron>,
    @InjectModel(CuentaApp.name) private cuentaAppModel: Model<CuentaApp>
    
  ) {}

  /**
   * Crear un nuevo patrón de autenticación
   */
 async crearPatronAutenticacion(
  idUsuario: string,
  nombre: string,
  dedosPatronIds: string[]
): Promise<PatronAutenticacion> {
  try {
    // Validar mínimo de 3 dedos patrón
    if (dedosPatronIds.length < 3) {
      throw new BadRequestException('Debe proporcionar al menos 3 dedos patrón');
    }

    // Validar existencia de usuario
    const cuentaAppUsuario = await this.cuentaAppModel.findOne({ persona: idUsuario });
    if (!cuentaAppUsuario) {
      throw new BadRequestException('El usuario no existe');
    }

    // Validar existencia de todos los dedos patrón
    const dedosExistentes = await this.dedoPatronModel
      .find({ _id: { $in: dedosPatronIds } })
      .exec();

    if (dedosExistentes.length !== dedosPatronIds.length) {
      throw new BadRequestException('Algunos dedos patrón no existen');
    }

    // Construir nuevo patrón de autenticación
    const nuevoPatron = new this.patronAutenticacionModel({
      id_patron_autenticacion: new Types.ObjectId(),
      nombre: nombre.trim(),
      fecha_creacion: new Date(),
      activo: true,
      dedos_patron: dedosPatronIds, // el orden se refleja en el índice del array
    });

    return await nuevoPatron.save();
  } catch (error) {
    throw new BadRequestException(`Error al crear patrón de autenticación: ${error.message}`);
  }
}


  /**
   * Obtener patrón de autenticación por ID con sus dedos patrón
   */
  async obtenerPatronPorId(patronId: string): Promise<PatronAutenticacion> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .populate({
          path: 'dedos_patron',
          populate: {
            path: 'dedos_registrados',
            model: 'DedoRegistrado'
          }
        })
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      return patron;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener patrón: ${error.message}`);
    }
  }

  /**
   * Obtener dedos patrón de un patrón específico
   */
  async obtenerDedosPatron(patronId: string): Promise<DedoPatron[]> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .populate('dedos_patron')
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      if (!patron.activo) {
        throw new BadRequestException('El patrón de autenticación está inactivo');
      }

      return patron.dedos_patron as DedoPatron[];
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error al obtener dedos patrón: ${error.message}`);
    }
  }

  /**
   * Obtener patrones activos por cuenta de aplicación
   */
  async obtenerPatronesPorCuenta(idUsuario: string): Promise<PatronAutenticacion[]> {
    try {
      // Primero obtenemos los dedos patrón de la cuenta
      const cuentaAppUsuario = await this.cuentaAppModel.findOne({persona:idUsuario});

      const dedosPatron = await this.dedoPatronModel
        .find({ id_cuenta_app: cuentaAppUsuario._id })
        .exec();

      const dedosPatronIds = dedosPatron.map(dedo => dedo._id);

      // Luego buscamos patrones que contengan esos dedos
      const patrones = await this.patronAutenticacionModel
        .find({
          activo: true,
          dedos_patron: { $in: dedosPatronIds }
        })
        .populate('dedos_patron')
        .exec();

      return patrones;
    } catch (error) {
      throw new BadRequestException(`Error al obtener patrones: ${error.message}`);
    }
  }

  /**
   * Activar/Desactivar patrón de autenticación
   */
  async cambiarEstadoPatron(patronId: string, activo: boolean): Promise<PatronAutenticacion> {
    try {
      const patron = await this.patronAutenticacionModel
        .findByIdAndUpdate(
          patronId,
          { activo },
          { new: true }
        )
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      return patron;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al cambiar estado del patrón: ${error.message}`);
    }
  }

  /**
   * Validar si un patrón está activo y disponible para autenticación
   */
  async validarPatronParaAutenticacion(patronId: string): Promise<boolean> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .exec();

      return patron && patron.activo;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener información completa del patrón para autenticación
   */
  async obtenerPatronParaAutenticacion(patronId: string): Promise<{
    patron: PatronAutenticacion;
    dedosPatron: DedoPatron[];
  }> {
    try {
      const patron = await this.obtenerPatronPorId(patronId);
      
      if (!patron.activo) {
        throw new BadRequestException('El patrón de autenticación está inactivo');
      }

      const dedosPatron = await this.obtenerDedosPatron(patronId);

      return {
        patron,
        dedosPatron
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener información básica del patrón
   */
  async obtenerPatronBasico(patronId: string): Promise<{
    _id: string;
    nombre: string;
    fecha_creacion: Date;
    activo: boolean;
    cantidadDedos: number;
  }> {
    try {
      const patron = await this.patronAutenticacionModel
        .findById(patronId)
        .select('nombre fecha_creacion activo dedos_patron')
        .exec();

      if (!patron) {
        throw new NotFoundException(`Patrón con ID ${patronId} no encontrado`);
      }

      return {
        _id: patron._id.toString(),
        nombre: patron.nombre,
        fecha_creacion: patron.fecha_creacion,
        activo: patron.activo,
        cantidadDedos: patron.dedos_patron ? patron.dedos_patron.length : 0
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Error al obtener información del patrón: ${error.message}`);
    }
  }
  //Validacion de patron de autenticacion
  async validarCompraConPatron(body: {
  cuentaId: string;
  monto: string;
  sensorIds: string[];
}) {
  const { cuentaId, sensorIds } = body;

  // Obtener los dedos del patrón para esta cuenta
  const dedosPatron = await this.dedoPatronModel
    .find({ id_cuenta_app: cuentaId })
    .populate('dedos_registrados');

  if (!dedosPatron || dedosPatron.length === 0) {
    return {
      valid: false,
      message: 'No existe un patrón registrado para esta cuenta.'
    };
  }

  // Extraer los sensorId reales del campo "huella"
  const idsPatron = dedosPatron.map((dedoPatron) => {
    const huellaCompleta = dedoPatron.dedos_registrados?.huella || "";
    return huellaCompleta.split(":")[0]; // obtener sensorId antes de ":"
  });

  // Comparar con los IDs enviados
  const coincidencias = sensorIds.filter(id => idsPatron.includes(id));

  if (coincidencias.length >= 3) {
    return {
      valid: true,
      message: 'Patrón válido. Compra autorizada.'
    };
  } else {
    return {
      valid: false,
      message: 'No se reconoció un patrón válido. Huellas insuficientes o incorrectas.'
    };
  }
}

}