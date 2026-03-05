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
   * GET /api/mesas/:id
   * Obtener una mesa específica por ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const mesa = await req.prisma.mesa.findUnique({
        where: { id },
        include: {
          ordenes: {
            where: { estado: { in: ['PENDIENTE', 'EN_CURSO'] } },
          },
        },
      });

      if (!mesa) {
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Mesa obtenida',
        data: mesa,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/mesas
   * Crear una nueva mesa
   */
  static async create(req: Request, res: Response) {
    try {
      const { numero, capacidad } = req.body;

      if (!numero || !capacidad) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: numero, capacidad',
        });
      }

      const mesa = await req.prisma.mesa.create({
        data: {
          numero: parseInt(numero),
          capacidad: parseInt(capacidad),
          estado: 'DISPONIBLE',
          activo: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Mesa creada',
        data: mesa,
      });
    } catch (error: any) {
      res.status(400).json({
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
      let estadoUpper = String(estado).toLowerCase();
      switch (estadoUpper) {
        case 'ocupado':
        case 'ocupada':
          estadoUpper = 'OCUPADA';
          break;
        case 'reservada':
          estadoUpper = 'RESERVADA';
          break;
        case 'fuera_de_servicio':
          estadoUpper = 'FUERA_DE_SERVICIO';
          break;
        default:
          estadoUpper = estadoUpper.toUpperCase();
      }
      if (!estadosValidos.includes(estadoUpper)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
      }
      if (estadoUpper === 'DISPONIBLE') {
        // Cancelar cualquier orden activa al liberar la mesa
        await req.prisma.orden.updateMany({
          where: {
            mesaId: id,
            estado: { in: ['PENDIENTE', 'EN_CURSO'] }
          },
          data: { estado: 'CANCELADA' }
        });
      }

      // store normalized value
      const mesa = await req.prisma.mesa.update({
        where: { id },
        data: { estado: estadoUpper },
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

  /**
   * PATCH /api/mesas/:id
   * Actualizar propiedades de una mesa
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { numero, capacidad, estado, activo } = req.body;

      console.log(`🔄 [MesaController.update] Actualizando mesa ${id} con datos:`, { numero, capacidad, estado, activo });

      // Build payload incrementally so we can normalize/validate
      const data: any = {};
      if (numero !== undefined) {
        data.numero = parseInt(numero);
      }
      if (capacidad !== undefined) {
        data.capacidad = parseInt(capacidad);
      }

      if (estado !== undefined) {
        // normalize string and map to valid enum variants
        let estadoUpper = String(estado).toLowerCase();

        switch (estadoUpper) {
          case 'ocupado':
          case 'ocupada':
            estadoUpper = 'OCUPADA';
            break;
          case 'reservada':
            estadoUpper = 'RESERVADA';
            break;
          case 'fuera_de_servicio':
            estadoUpper = 'FUERA_DE_SERVICIO';
            break;
          default:
            estadoUpper = estadoUpper.toUpperCase();
        }

        const estadosValidos = ['DISPONIBLE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO'];
        if (!estadosValidos.includes(estadoUpper)) {
          console.error(`❌ [MesaController.update] Estado inválido: ${estadoUpper}`);
          return res.status(400).json({
            success: false,
            message: 'Estado inválido',
          });
        }
        data.estado = estadoUpper;
        console.log(`✅ [MesaController.update] Estado normalizado a: ${estadoUpper}`);
      }

      if (activo !== undefined) {
        data.activo = activo;
      }

      if (data.estado === 'DISPONIBLE') {
        // Cancelar cualquier orden activa al liberar la mesa
        await req.prisma.orden.updateMany({
          where: {
            mesaId: id,
            estado: { in: ['PENDIENTE', 'EN_CURSO'] }
          },
          data: { estado: 'CANCELADA' }
        });
      }

      console.log(`🔄 [MesaController.update] Actualizando BD con payload:`, data);
      const mesa = await req.prisma.mesa.update({
        where: { id },
        data,
      });

      console.log(`✅ [MesaController.update] Mesa actualizada en BD:`, { id, estado: mesa.estado });
      res.json({
        success: true,
        message: 'Mesa actualizada',
        data: mesa,
      });
    } catch (error: any) {
      console.error(`❌ [MesaController.update] Error:`, error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/mesas/:id
   * Eliminar una mesa
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await req.prisma.mesa.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Mesa eliminada',
        data: null,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
