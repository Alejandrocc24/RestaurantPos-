import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registra un nuevo usuario
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, nombre } = req.body;

      if (!email || !password || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y nombre son requeridos',
        });
      }

      const authService = new AuthService(req.prisma);
      const user = await authService.register(email, password, nombre);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/auth/login
   * Inicia sesión un usuario
   * El tenantId se extrae automáticamente del dominio del email
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos',
        });
      }

      // El tenantId ya fue inyectado por optionalTenantMiddleware
      const tenantId = req.tenantId || '';

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'TenantId es requerido',
        });
      }

      const authService = new AuthService(req.prisma);
      const response = await authService.login(email, password, tenantId);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: response,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/auth/me
   * Obtiene datos del usuario actual
   */
  static async getMe(req: Request, res: Response) {
    try {
      const authService = new AuthService(req.prisma);
      const user = await authService.getUserById(req.userId!);

      res.json({
        success: true,
        message: 'Usuario obtenido',
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/auth/password
   * Actualiza la contraseña del usuario
   */
  static async updatePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva son requeridas',
        });
      }

      const authService = new AuthService(req.prisma);
      const result = await authService.updatePassword(req.userId!, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
