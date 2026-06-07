import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { config } from '../config/index.js';
import { verifyRefreshToken, generateToken, generateRefreshToken, hashToken } from '../utils/auth.js';

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

      console.log('✅ [AuthController.login] Response recibida:', !!response, !!response.accessToken, !!response.refreshToken);

      // Guardar refresh token en cookie HttpOnly
      try {
        res.cookie('refreshToken', response.refreshToken, {
          httpOnly: true,
          secure: config.isProduction,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        });
        console.log('✅ [AuthController.login] Cookie de refresh token seteada');
      } catch (e) {
        console.error('⚠️ [AuthController.login] Error al setear cookie:', (e as any).message);
        // Ignorar si la cookie no se puede setear en SSR/tests
      }

      console.log('✅ [AuthController.login] Enviando respuesta de login exitoso');
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          accessToken: response.accessToken,
          user: response.user,
        },
      });
    } catch (error: any) {
      console.error('❌ [AuthController.login] Error en login:', error.name, error.message);
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresca access token usando refresh token en cookie
   */
  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token no proporcionado' });
      }

      // Verificar refresh token
      const payload = verifyRefreshToken(refreshToken);
      const userId = payload.userId;

      // Obtener usuario y comparar
      const authService = new AuthService(req.prisma);
      const user = await req.prisma.usuario.findUnique({ where: { id: userId } });
      if (!user || !user.refreshToken || user.refreshToken !== hashToken(refreshToken)) {
        return res.status(401).json({ success: false, message: 'Refresh token inválido' });
      }

      // Generar nuevo access token y refresh token (rotación)
      const accessToken = generateToken({ userId: user.id, email: user.email, tenantId: payload.tenantId });
      const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, tenantId: payload.tenantId });

      // Guardar nuevo refresh token
      await req.prisma.usuario.update({ where: { id: user.id }, data: { refreshToken: hashToken(newRefreshToken) } });

      // Setear cookie con nuevo refresh token
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, data: { accessToken } });
    } catch (error: any) {
      res.status(401).json({ success: false, message: 'No se pudo refrescar token' });
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
