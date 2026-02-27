import { Request, Response } from 'express';

export class CajaController {
  static async getAll(req: Request, res: Response) {
    try {
      const cajas = await req.prisma.caja.findMany({ orderBy: { fecha_apertura: 'desc' } });
      res.json({ success: true, message: 'Cajas obtenidas', data: cajas });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const caja = await req.prisma.caja.findUnique({ where: { id } });
      if (!caja) return res.status(404).json({ success: false, message: 'Caja no encontrada' });
      res.json({ success: true, message: 'Caja obtenida', data: caja });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { monto_inicial, usuario_apertura_id } = req.body;
      if (monto_inicial === undefined) {
        return res.status(400).json({ success: false, message: 'monto_inicial es requerido' });
      }

      const nueva = await req.prisma.caja.create({
        data: {
          monto_inicial: Number(monto_inicial) || 0,
          estado: 'abierta',
          usuario_apertura_id: usuario_apertura_id ? String(usuario_apertura_id) : null,
          fecha_apertura: new Date(),
          total_gastos: 0,
        },
      });

      res.status(201).json({ success: true, message: 'Caja creada', data: nueva });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body || {};

      // Si se está cerrando la caja, asegurar fecha_cierre
      if (payload.estado === 'cerrada' && !payload.fecha_cierre) {
        payload.fecha_cierre = new Date();
      }

      const updated = await req.prisma.caja.update({ where: { id }, data: payload });
      res.json({ success: true, message: 'Caja actualizada', data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await req.prisma.caja.delete({ where: { id } });
      res.json({ success: true, message: 'Caja eliminada' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default CajaController;
