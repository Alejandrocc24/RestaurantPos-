import { Request, Response } from 'express';

export class ComentarioController {
  /**
   * GET /api/comentarios
   * Listar todos los comentarios con paginación
   */
  static async getAll(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      const ordenId = req.query.ordenId as string;

      const where: any = {};
      if (ordenId) {
        where.ordenId = ordenId;
      }

      const [comentarios, total] = await Promise.all([
        req.prisma.comentario.findMany({
          where,
          skip,
          take,
          include: { orden: true },
          orderBy: { createdAt: 'desc' },
        }),
        req.prisma.comentario.count({ where }),
      ]);

      res.json({
        success: true,
        message: 'Comentarios obtenidos',
        data: comentarios,
        pagination: { skip, take, total },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/comentarios/:id
   * Obtener un comentario por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const comentario = await req.prisma.comentario.findUnique({
        where: { id },
        include: { orden: true },
      });

      if (!comentario) {
        return res.status(404).json({
          success: false,
          message: 'Comentario no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Comentario obtenido',
        data: comentario,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/comentarios
   * Crear nuevo comentario
   */
  static async create(req: Request, res: Response) {
    try {
      const { ordenId, contenido, tipoComentario = 'GENERAL', severidad = 'NORMAL' } =
        req.body;

      if (!ordenId || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'ordenId y contenido son requeridos',
        });
      }

      const comentario = await req.prisma.comentario.create({
        data: {
          ordenId,
          contenido,
          tipoComentario,
          severidad,
        },
        include: { orden: true },
      });

      res.status(201).json({
        success: true,
        message: 'Comentario creado exitosamente',
        data: comentario,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/comentarios/:id
   * Actualizar un comentario
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contenido, tipoComentario, severidad, activo } = req.body;

      const comentario = await req.prisma.comentario.update({
        where: { id },
        data: {
          ...(contenido && { contenido }),
          ...(tipoComentario && { tipoComentario }),
          ...(severidad && { severidad }),
          ...(activo !== undefined && { activo }),
        },
        include: { orden: true },
      });

      res.json({
        success: true,
        message: 'Comentario actualizado',
        data: comentario,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/comentarios/:id
   * Eliminar un comentario (soft delete)
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await req.prisma.comentario.update({
        where: { id },
        data: { activo: false },
      });

      res.json({
        success: true,
        message: 'Comentario eliminado',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/comentarios/orden/:ordenId
   * Obtener todos los comentarios de una orden
   */
  static async getByOrdenId(req: Request, res: Response) {
    try {
      const { ordenId } = req.params;

      const comentarios = await req.prisma.comentario.findMany({
        where: { ordenId, activo: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        message: 'Comentarios de la orden obtenidos',
        data: comentarios,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
