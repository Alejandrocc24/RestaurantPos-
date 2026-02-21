import { Request, Response } from 'express';

export class RolController {
  static async getRoles(req: Request, res: Response) {
    try {
      const { skip, take, search } = req.query;

      const where: any = {};

      if (search) {
        where.nombre = { contains: String(search), mode: 'insensitive' };
      }

      const roles = await req.prisma.rol.findMany({
        where,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
        orderBy: { nombre: 'asc' },
        include: {
          permisos: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: roles
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getRolById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rol = await req.prisma.rol.findUnique({
        where: { id },
        include: {
          permisos: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      if (!rol) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      res.json({
        success: true,
        data: rol
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createRol(req: Request, res: Response) {
    try {
      const { nombre, descripcion, permisos } = req.body;

      // Validar campos requeridos
      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'nombre es requerido'
        });
      }

      // Verificar que el rol no exista
      const existente = await req.prisma.rol.findUnique({
        where: { nombre }
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'El rol ya existe'
        });
      }

      // Crear rol
      const rol = await req.prisma.rol.create({
        data: {
          nombre,
          descripcion,
          activo: true,
          permisos: permisos && permisos.length > 0 ? {
            connect: permisos.map((id: string) => ({ id }))
          } : undefined
        },
        include: {
          permisos: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: rol
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateRol(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, activo, permisos } = req.body;

      // Verificar que el rol existe
      const existe = await req.prisma.rol.findUnique({
        where: { id },
        include: {
          permisos: {
            select: {
              id: true
            }
          }
        }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Preparar los datos de actualización
      const updateData: any = {
        nombre,
        descripcion,
        activo
      };

      // Si se proporcionan permisos, validar que existan y actualizar
      if (permisos && Array.isArray(permisos) && permisos.length > 0) {
        // Extraer IDs de los permisos (pueden ser strings o objetos con id)
        const permisosIds = permisos.map((p: any) => typeof p === 'string' ? p : p.id).filter(Boolean);

        if (permisosIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No se proporcionaron IDs de permisos válidos'
          });
        }

        // Validar que todos los permisos existan
        const permisosExistentes = await req.prisma.permiso.findMany({
          where: {
            id: {
              in: permisosIds
            }
          },
          select: {
            id: true
          }
        });

        if (permisosExistentes.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Los permisos especificados no existen'
          });
        }

        // Desconectar todos los permisos actuales y conectar los nuevos
        updateData.permisos = {
          disconnect: existe.permisos.map((p: any) => ({ id: p.id })),
          connect: permisosExistentes.map((p: any) => ({ id: p.id }))
        };
      }

      const rol = await req.prisma.rol.update({
        where: { id },
        data: updateData,
        include: {
          permisos: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: rol
      });
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteRol(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar que el rol existe
      const existe = await req.prisma.rol.findUnique({
        where: { id }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      await req.prisma.rol.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Rol eliminado correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
