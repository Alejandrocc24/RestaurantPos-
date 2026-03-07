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
          // Solo incluimos órdenes OCUPADAS para saber si hay productos (no para calcular estado)
          // El estado oficial de la mesa viene del campo `estado` de la BD
          ordenes: {
            where: { estado: { in: ['PENDIENTE', 'EN_CURSO', 'COMPLETADA'] } },
            take: 1, // solo necesitamos saber si hay alguna
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
      const { numero, capacidad, posicion, ubicacion } = req.body;

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

      // Check if mesa number already exists
      const existingMesa = await req.prisma.mesa.findUnique({
        where: { numero: numValue },
      });

      if (existingMesa) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una mesa con el número ${numValue}`,
        });
      }

      const mesa = await req.prisma.mesa.create({
        data: {
          numero: numValue,
          capacidad: capValue,
          estado: 'DISPONIBLE',
          activo: true,
          posicion: posicion ? String(posicion) : null,
          ubicacion: ubicacion ? String(ubicacion) : null,
        },
      });

      console.log('✅ [MesaController.create] Mesa creada:', { id: mesa.id, numero: mesa.numero });

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
      const { numero, capacidad, estado, activo, posicion, ubicacion } = req.body;

      console.log(`🔄 [MesaController.update] Actualizando mesa ${id} con datos:`, { numero, capacidad, estado, activo, posicion, ubicacion });

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
