import { Request, Response } from 'express';

export class MesaController {
  /**
   * GET /api/mesas
   * Listar todas las mesas
   */
  static async getAll(req: Request, res: Response) {
    try {
      const mesas = await req.prisma.mesa.findMany({
        orderBy: { numero: 'asc' },
        include: {
          ordenes: {
            where: { estado: { in: ['PENDIENTE', 'EN_CURSO'] } },
          },
        },
      });

      res.json({
        success: true,
        message: 'Mesas obtenidas',
        data: mesas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/mesas/:id
   * Actualizar estado de una mesa
   */
  static async updateEstado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const estadosValidos = ['DISPONIBLE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
      }

      const mesa = await req.prisma.mesa.update({
        where: { id },
        data: { estado },
      });

      res.json({
        success: true,
        message: 'Mesa actualizada',
        data: mesa,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
