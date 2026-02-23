import { Request, Response } from 'express';

export class ProveedorController {
  /**
   * GET /api/proveedores
   * Listar todos los proveedores con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      const { search } = req.query;

      const where: any = { activo: true };
      
      if (search) {
        where.OR = [
          { nombre: { contains: String(search), mode: 'insensitive' } },
          { correo: { contains: String(search), mode: 'insensitive' } },
          { contacto: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      const [proveedores, total] = await Promise.all([
        req.prisma.proveedor.findMany({
          where,
          skip,
          take,
          orderBy: { nombre: 'asc' }
        }),
        req.prisma.proveedor.count({ where })
      ]);

      res.json({
        success: true,
        message: 'Proveedores obtenidos',
        data: proveedores,
        pagination: { skip, take, total }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/proveedores/:id
   * Obtener un proveedor por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const proveedor = await req.prisma.proveedor.findUnique({
        where: { id },
        include: {
          compras: {
            select: {
              id: true,
              numeroDocumento: true,
              total: true,
              fecha: true
            }
          }
        }
      });

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Proveedor obtenido',
        data: proveedor
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/proveedores
   * Crear nuevo proveedor
   */
  static async create(req: Request, res: Response) {
    try {
      const { nombre, contacto, correo, telefono, direccion, ciudad } = req.body;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del proveedor es requerido'
        });
      }

      // Verificar si ya existe un proveedor con ese nombre
      const existente = await req.prisma.proveedor.findUnique({
        where: { nombre }
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un proveedor con ese nombre'
        });
      }

      const proveedor = await req.prisma.proveedor.create({
        data: {
          nombre,
          contacto,
          correo,
          telefono,
          direccion,
          ciudad,
          activo: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: proveedor
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PATCH /api/proveedores/:id
   * Actualizar un proveedor
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, contacto, correo, telefono, direccion, ciudad, activo } = req.body;

      // Verificar si el proveedor existe
      const proveedor = await req.prisma.proveedor.findUnique({
        where: { id }
      });

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      // Si cambió el nombre, verificar que no exista otro con ese nombre
      if (nombre && nombre !== proveedor.nombre) {
        const existente = await req.prisma.proveedor.findUnique({
          where: { nombre }
        });

        if (existente) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro proveedor con ese nombre'
          });
        }
      }

      const actualizado = await req.prisma.proveedor.update({
        where: { id },
        data: {
          nombre: nombre || proveedor.nombre,
          contacto: contacto !== undefined ? contacto : proveedor.contacto,
          correo: correo !== undefined ? correo : proveedor.correo,
          telefono: telefono !== undefined ? telefono : proveedor.telefono,
          direccion: direccion !== undefined ? direccion : proveedor.direccion,
          ciudad: ciudad !== undefined ? ciudad : proveedor.ciudad,
          activo: activo !== undefined ? activo : proveedor.activo
        }
      });

      res.json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: actualizado
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/proveedores/:id
   * Eliminar un proveedor (soft delete)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar si existe
      const proveedor = await req.prisma.proveedor.findUnique({
        where: { id }
      });

      if (!proveedor) {
        return res.status(404).json({
          success: false,
          message: 'Proveedor no encontrado'
        });
      }

      // Soft delete
      await req.prisma.proveedor.update({
        where: { id },
        data: { activo: false }
      });

      res.json({
        success: true,
        message: 'Proveedor eliminado exitosamente'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
