import { Request, Response } from 'express';
import { SocketService } from '../services/socket.service.js';

export class SalonController {
  static async getAll(req: Request, res: Response) {
    try {
      const salones = await req.prisma.salon.findMany({
        orderBy: { createdAt: 'asc' },
        include: { _count: { select: { mesas: true } } }
      });
      return res.json({ success: true, message: 'Salones obtenidos', data: salones });
    } catch (error: any) {
      console.error('❌ Error obteniendo salones:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const salon = await req.prisma.salon.findUnique({
        where: { id },
        include: { _count: { select: { mesas: true } } }
      });
      if (!salon) {
        return res.status(404).json({ success: false, message: 'Salón no encontrado' });
      }
      return res.json({ success: true, message: 'Salón obtenido', data: salon });
    } catch (error: any) {
      console.error('❌ Error obteniendo salón:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nombre } = req.body;
      if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, message: 'El nombre del salón es requerido' });
      }
      const normalized = String(nombre).trim().toLowerCase();
      if (normalized === 'mostrador' || normalized === 'domicilio') {
        return res.status(400).json({ success: false, message: 'Ese nombre no está permitido' });
      }
      const salon = await req.prisma.salon.create({
        data: { nombre: normalized }
      });
      SocketService.emitGlobal('salonCreado', salon);
      return res.status(201).json({ success: true, message: 'Salón creado', data: salon });
    } catch (error: any) {
      console.error('❌ Error creando salón:', error.message);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, message: 'Ya existe un salón con ese nombre' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ success: false, message: 'El nombre del salón es requerido' });
      }
      const normalized = String(nombre).trim().toLowerCase();
      const salon = await req.prisma.salon.update({
        where: { id },
        data: { nombre: normalized }
      });
      // Sync ubicacion on linked mesas
      await req.prisma.mesa.updateMany({
        where: { salonId: id },
        data: { ubicacion: normalized }
      });
      SocketService.emitGlobal('salonActualizado', salon);
      return res.json({ success: true, message: 'Salón actualizado', data: salon });
    } catch (error: any) {
      console.error('❌ Error actualizando salón:', error.message);
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Salón no encontrado' });
      }
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, message: 'Ya existe un salón con ese nombre' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const mesaCount = await req.prisma.mesa.count({ where: { salonId: id } });
      if (mesaCount > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar el salón porque tiene ${mesaCount} mesa(s) asignada(s)`,
        });
      }
      await req.prisma.salon.delete({ where: { id } });
      SocketService.emitGlobal('salonEliminado', { id });
      return res.json({ success: true, message: 'Salón eliminado' });
    } catch (error: any) {
      console.error('❌ Error eliminando salón:', error.message);
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Salón no encontrado' });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
