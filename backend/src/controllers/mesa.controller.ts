import { Request, Response } from 'express';
import { SocketService } from '../services/socket.service.js';

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
          salon: true,
          ordenes: {
            where: { estado: { in: ['PENDIENTE', 'EN_CURSO', 'COMPLETADA'] } },
            take: 1,
          },
        },
      });

      // Usar el estado real de la BD — no recalcular desde órdenes.
      // Una mesa puede estar DISPONIBLE aunque tenga órdenes PENDIENTE/EN_CURSO en cocina
      // (el mesero cerró la mesa pero la cocina aún prepara el pedido).
      const mesasConEstado = mesas.map((mesa: any) => {
        // Normalizar: la BD puede tener OCUPADA/DISPONIBLE en mayúsculas
        const estadoNormalizado = String(mesa.estado ?? 'DISPONIBLE').toLowerCase();
        const estadoFrontend = (estadoNormalizado === 'ocupada' || estadoNormalizado === 'ocupado')
          ? 'OCUPADA'
          : 'DISPONIBLE';

        return {
          ...mesa,
          estado: estadoFrontend,
          tieneOrdenActiva: mesa.ordenes?.length > 0,
        };
      });

      res.json({
        success: true,
        message: 'Mesas obtenidas',
        data: mesasConEstado,
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
      const { numero, capacidad, posicion, ubicacion, salonId, forma } = req.body;

      console.log('📝 [MesaController.create] Body recibido:', JSON.stringify(req.body));

      // Validate required fields
      const numValue = Number(numero);
      const capValue = Number(capacidad);

      if (!numero || isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El número de mesa es requerido y debe ser un número positivo',
        });
      }

      if (!capacidad || isNaN(capValue) || capValue <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La capacidad es requerida y debe ser un número positivo',
        });
      }

      // Resolve salonId and ubicacion before checking duplicates
      let resolvedUbicacion = ubicacion ? String(ubicacion) : null;
      let resolvedSalonId = salonId ? String(salonId) : null;
      if (resolvedSalonId && !resolvedUbicacion) {
        const salon = await req.prisma.salon.findUnique({ where: { id: resolvedSalonId } });
        if (salon) resolvedUbicacion = salon.nombre;
      }

      // Check if mesa number already exists in the same salon
      const existingMesa = await req.prisma.mesa.findFirst({
        where: { numero: numValue, salonId: resolvedSalonId },
      });

      if (existingMesa) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una mesa con el número ${numValue} en esta ubicación`,
        });
      }

      const mesa = await req.prisma.mesa.create({
        data: {
          numero: numValue,
          capacidad: capValue,
          estado: 'DISPONIBLE',
          activo: true,
          forma: forma ? String(forma) : 'rounded',
          posicion: posicion ? String(posicion) : null,
          ubicacion: resolvedUbicacion,
          salonId: resolvedSalonId,
        },
      });

      console.log('✅ [MesaController.create] Mesa creada:', { id: mesa.id, numero: mesa.numero });

      SocketService.emitGlobal('mesaCreada', mesa);

      res.status(201).json({
        success: true,
        message: 'Mesa creada',
        data: mesa,
      });
    } catch (error: any) {
      console.error('❌ [MesaController.create] Error:', error.message);

      // Prisma unique constraint error
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una mesa con ese número',
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Error al crear la mesa',
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
      // Al liberar la mesa solo se actualiza su estado — las órdenes mantienen el suyo.
      // La cocina sigue viendo y procesando las comandas independientemente del estado de la mesa.


      // store normalized value
      const mesa = await req.prisma.mesa.update({
        where: { id },
        data: { estado: estadoUpper },
      });

      SocketService.emitGlobal('mesaActualizada', mesa);

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
      const { numero, capacidad, estado, activo, posicion, ubicacion, salonId, forma } = req.body;

      console.log(`🔄 [MesaController.update] Actualizando mesa ${id} con datos:`, { numero, capacidad, estado, activo, posicion, ubicacion, salonId, forma });

      // Build payload incrementally so we can normalize/validate
      const data: any = {};
      if (numero !== undefined) {
        data.numero = parseInt(numero);
      }
      if (capacidad !== undefined) {
        data.capacidad = parseInt(capacidad);
      }
      if (posicion !== undefined) {
        data.posicion = posicion ? String(posicion) : null;
      }
      if (ubicacion !== undefined) {
        data.ubicacion = ubicacion ? String(ubicacion) : null;
      }
      if (salonId !== undefined) {
        data.salonId = salonId ? String(salonId) : null;
      }
      if (forma !== undefined) {
        data.forma = forma ? String(forma) : 'rounded';
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

      // Al liberar la mesa solo se actualiza su estado — las órdenes mantienen el suyo.


      console.log(`🔄 [MesaController.update] Actualizando BD con payload:`, data);
      const mesa = await req.prisma.mesa.update({
        where: { id },
        data,
      });

      console.log(`✅ [MesaController.update] Mesa actualizada en BD:`, { id, estado: mesa.estado });

      SocketService.emitGlobal('mesaActualizada', mesa);

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

      SocketService.emitGlobal('mesaEliminada', { id });

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
