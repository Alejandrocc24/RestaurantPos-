import { Request, Response } from 'express';

export class CategoriaGastoController {
  static async getCategorias(req: Request, res: Response) {
    try {
      const { skip, take, search } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { nombre: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      const categorias = await req.prisma.categoriaGasto.findMany({
        where,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          activo: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: categorias
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getCategoriaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const categoria = await req.prisma.categoriaGasto.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          activo: true,
          createdAt: true
        }
      });

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría de gasto no encontrada'
        });
      }

      res.json({
        success: true,
        data: categoria
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createCategoria(req: Request, res: Response) {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es requerido'
        });
      }

      const categoria = await req.prisma.categoriaGasto.create({
        data: {
          nombre,
          descripcion,
          activo: true
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          activo: true,
          createdAt: true
        }
      });

      res.status(201).json({
        success: true,
        data: categoria
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateCategoria(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, descripcion, activo } = req.body;

      const existe = await req.prisma.categoriaGasto.findUnique({
        where: { id }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Categoría de gasto no encontrada'
        });
      }

      const categoria = await req.prisma.categoriaGasto.update({
        where: { id },
        data: {
          nombre,
          descripcion,
          activo
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          activo: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: categoria
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteCategoria(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existe = await req.prisma.categoriaGasto.findUnique({
        where: { id }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Categoría de gasto no encontrada'
        });
      }

      await req.prisma.categoriaGasto.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Categoría de gasto eliminada correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
