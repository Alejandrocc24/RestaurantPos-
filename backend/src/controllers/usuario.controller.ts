import { Request, Response } from 'express';

export class UsuarioController {
  static async getUsuarios(req: Request, res: Response) {
    try {
      const { skip, take, search } = req.query;

      const where: any = {};

      if (search) {
        where.OR = [
          { nombre: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      const usuarios = await req.prisma.usuario.findMany({
        where,
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined,
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          email: true,
          nombre: true,
          activo: true,
          createdAt: true,
          roles: {
            select: {
              rol: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: usuarios
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getUsuarioById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = await req.prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          nombre: true,
          activo: true,
          createdAt: true,
          roles: {
            select: {
              rol: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createUsuario(req: Request, res: Response) {
    try {
      const { email, nombre, password, roles } = req.body;

      // Validar campos requeridos
      if (!email || !nombre || !password) {
        return res.status(400).json({
          success: false,
          message: 'email, nombre y password son requeridos'
        });
      }

      // Verificar que el email no exista
      const existente = await req.prisma.usuario.findUnique({
        where: { email }
      });

      if (existente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Crear usuario
      const usuario = await req.prisma.usuario.create({
        data: {
          email,
          nombre,
          password,
          activo: true,
          roles: roles && roles.length > 0 ? {
            create: roles.map((rolId: string) => ({
              rolId
            }))
          } : undefined
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          activo: true,
          createdAt: true,
          roles: {
            select: {
              rol: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: usuario
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, activo, roles } = req.body;

      // Verificar que el usuario existe
      const existe = await req.prisma.usuario.findUnique({
        where: { id }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si se actualizar los roles, primero eliminar los existentes
      if (roles) {
        await req.prisma.usuarioRol.deleteMany({
          where: { usuarioId: id }
        });
      }

      const usuario = await req.prisma.usuario.update({
        where: { id },
        data: {
          nombre,
          activo,
          roles: roles ? {
            create: roles.map((rolId: string) => ({
              rolId
            }))
          } : undefined
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          activo: true,
          createdAt: true,
          roles: {
            select: {
              rol: {
                select: {
                  id: true,
                  nombre: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: usuario
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar que el usuario existe
      const existe = await req.prisma.usuario.findUnique({
        where: { id }
      });

      if (!existe) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      await req.prisma.usuario.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
