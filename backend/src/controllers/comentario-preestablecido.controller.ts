import { Request, Response } from 'express';

export class ComentarioPreestablecidoController {
  /**
   * GET /api/comentarios-preestablecidos
   * Listar todos los comentarios preestablecidos
   */
  static async getAll(req: Request, res: Response) {
    try {
      const incluirInactivos = req.query.incluirInactivos === 'true';
      
      const where = incluirInactivos ? {} : { activo: true };

      const comentarios = await req.prisma.comentarioPreestablecido.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      res.json({
        success: true,
        message: 'Comentarios preestablecidos obtenidos',
        data: comentarios,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/comentarios-preestablecidos/:id
   * Obtener un comentario preestablecido por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const comentario = await req.prisma.comentarioPreestablecido.findUnique({
        where: { id },
      });

      if (!comentario) {
        return res.status(404).json({
          success: false,
          message: 'Comentario preestablecido no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Comentario preestablecido obtenido',
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
   * POST /api/comentarios-preestablecidos
   * Crear nuevo comentario preestablecido
   */
  static async create(req: Request, res: Response) {
    try {
      const { texto, activo = true } = req.body;

      if (!texto || !texto.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El texto es requerido',
        });
      }

      const comentario = await req.prisma.comentarioPreestablecido.create({
        data: {
          texto: texto.trim(),
          activo,
        },
      });

      res.json({
        success: true,
        message: 'Comentario preestablecido creado',
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
   * PUT /api/comentarios-preestablecidos/:id
   * Actualizar un comentario preestablecido
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { texto, activo } = req.body;

      // Validar que existe
      const existente = await req.prisma.comentarioPreestablecido.findUnique({
        where: { id },
      });

      if (!existente) {
        return res.status(404).json({
          success: false,
          message: 'Comentario preestablecido no encontrado',
        });
      }

      const updateData: any = {};
      if (texto !== undefined) {
        updateData.texto = texto.trim();
      }
      if (activo !== undefined) {
        updateData.activo = activo;
      }

      const comentario = await req.prisma.comentarioPreestablecido.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'Comentario preestablecido actualizado',
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
   * DELETE /api/comentarios-preestablecidos/:id
   * Eliminar un comentario preestablecido
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validar que existe
      const existente = await req.prisma.comentarioPreestablecido.findUnique({
        where: { id },
      });

      if (!existente) {
        return res.status(404).json({
          success: false,
          message: 'Comentario preestablecido no encontrado',
        });
      }

      await req.prisma.comentarioPreestablecido.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Comentario preestablecido eliminado',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
