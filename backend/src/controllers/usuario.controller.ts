import { Request, Response } from 'express';
import { hashPassword } from '../utils/auth.js';
import { config } from '../config/index.js';

export class UsuarioController {
  static async getUsuarios(req: Request, res: Response) {
    try {
      const { skip, take, search } = req.query;

      // Ejecutar ambas consultas en paralelo
      const [currentUser, allUsuarios] = await Promise.all([
        req.prisma.usuario.findUnique({
          where: { id: req.userId },
          select: { email: true }
        }),
        req.prisma.usuario.findMany({
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
        })
      ]);

      const isDevUser = currentUser?.email === config.devEmail;

      // Filtrar en memoria (más rápido que 2 queries separadas)
      let usuarios = allUsuarios;
      if (!isDevUser) {
        usuarios = usuarios.filter((u: any) => u.email !== config.devEmail);
      }
      if (search) {
        const searchLower = String(search).toLowerCase();
        usuarios = usuarios.filter((u: any) =>
          u.nombre?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
        );
      }

      // Agregar campo 'rol' simplificado para el frontend
      const usuariosConRol = usuarios.map((u: any) => ({
        ...u,
        rol: u.roles && u.roles.length > 0 ? u.roles[0].rol.nombre.toLowerCase() : 'usuario'
      }));

      res.json({
        success: true,
        data: usuariosConRol
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

      // Agregar campo 'rol' simplificado para el frontend
      const usuarioConRol = {
        ...usuario,
        rol: usuario.roles && usuario.roles.length > 0 ? usuario.roles[0].rol.nombre.toLowerCase() : 'usuario'
      };

      res.json({
        success: true,
        data: usuarioConRol
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
      const { email, nombre, password, rol, roles } = req.body;

      // Validar campos requeridos
      if (!email || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'email y nombre son requeridos'
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

      // Hash la contraseña (usar default si no se proporciona)
      const defaultPassword = Math.random().toString(36).slice(-8);
      const passwordToHash = password || defaultPassword;
      const hashedPassword = await hashPassword(passwordToHash);

      // Determinar roles a asignar
      let rolesToAssign = [];
      if (roles && Array.isArray(roles)) {
        // Si viene un array de IDs
        rolesToAssign = roles;
      } else if (rol) {
        // Si viene un string de rol, buscar el rol por nombre (case-insensitive)
        const rolObj = await req.prisma.rol.findFirst({
          where: {
            nombre: {
              mode: 'insensitive',
              equals: rol
            }
          }
        });
        if (rolObj) {
          rolesToAssign = [rolObj.id];
        }
      }

      // Crear usuario
      const usuario = await req.prisma.usuario.create({
        data: {
          email,
          nombre,
          password: hashedPassword,
          activo: true,
          roles: rolesToAssign.length > 0 ? {
            create: rolesToAssign.map((rolId: string) => ({
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

      // Agregar campo 'rol' simplificado para el frontend
      const usuarioConRol = {
        ...usuario,
        rol: usuario.roles && usuario.roles.length > 0 ? usuario.roles[0].rol.nombre.toLowerCase() : 'usuario'
      };

      res.status(201).json({
        success: true,
        data: usuarioConRol
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
      const { nombre, activo, password, rol, roles } = req.body;

      // Todo en una sola transacción
      const usuario = await req.prisma.$transaction(async (tx: any) => {
        // Verificar que el usuario existe
        const existe = await tx.usuario.findUnique({ where: { id } });
        if (!existe) throw new Error('NOT_FOUND');

        // Proteger usuario desarrollador
        if (existe.email === config.devEmail && req.userId !== existe.id) {
          throw new Error('FORBIDDEN');
        }

        const updateData: any = { nombre, activo };
        if (password) {
          updateData.password = await hashPassword(password);
        }

        // Resolver roles
        let rolesToAssign: string[] = [];
        if (roles && Array.isArray(roles)) {
          rolesToAssign = roles;
        } else if (rol) {
          const rolObj = await tx.rol.findFirst({
            where: { nombre: { mode: 'insensitive', equals: rol } }
          });
          if (rolObj) rolesToAssign = [rolObj.id];
        }

        if (rolesToAssign.length > 0) {
          await tx.usuarioRol.deleteMany({ where: { usuarioId: id } });
          updateData.roles = {
            create: rolesToAssign.map((rolId: string) => ({ rolId }))
          };
        }

        return tx.usuario.update({
          where: { id },
          data: updateData,
          select: {
            id: true, email: true, nombre: true, activo: true, createdAt: true,
            roles: { select: { rol: { select: { id: true, nombre: true } } } }
          }
        });
      });

      // Agregar campo 'rol' simplificado para el frontend
      const usuarioConRol = {
        ...usuario,
        rol: usuario.roles && usuario.roles.length > 0 ? usuario.roles[0].rol.nombre.toLowerCase() : 'usuario'
      };

      res.json({
        success: true,
        data: usuarioConRol
      });
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({ success: false, message: 'No tienes permisos para editar este usuario' });
      }
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

      // Proteger usuario desarrollador: NO se puede eliminar
      if (existe.email === config.devEmail) {
        return res.status(403).json({
          success: false,
          message: 'Este usuario no puede ser eliminado'
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
