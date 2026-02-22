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
        orderBy: { nombre: 'asc' }
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
        where: { id }
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
      const { nombre, descripcion, permisos, activo } = req.body;

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
          permisos: Array.isArray(permisos) ? permisos : [],
          activo: activo !== undefined ? activo : true
        }
      });

      res.status(201).json({
        success: true,
        data: rol,
        message: 'Rol creado exitosamente'
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
        where: { id }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado'
        });
      }

      // Preparar los datos de actualización
      const updateData: any = {
        activo: activo !== undefined ? activo : existe.activo
      };

      if (nombre) {
        // Validar que no exista otro rol con el mismo nombre
        if (nombre !== existe.nombre) {
          const otroRol = await req.prisma.rol.findUnique({
            where: { nombre }
          });

          if (otroRol) {
            return res.status(400).json({
              success: false,
              message: 'Ya existe otro rol con ese nombre'
            });
          }
        }
        updateData.nombre = nombre;
      }

      if (descripcion !== undefined) {
        updateData.descripcion = descripcion;
      }

      if (Array.isArray(permisos)) {
        updateData.permisos = permisos;
      }

      const rolActualizado = await req.prisma.rol.update({
        where: { id },
        data: updateData
      });

      res.json({
        success: true,
        data: rolActualizado,
        message: 'Rol actualizado exitosamente'
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
