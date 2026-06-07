import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken, hashToken } from '../utils/auth.js';
import { isValidEmail, isValidPassword, isValidName } from '../utils/validation.js';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registra un nuevo usuario en el tenant
   */
  async register(email: string, password: string, nombre: string) {
    // Validaciones
    if (!isValidEmail(email)) {
      throw new Error('Email inválido');
    }

    if (!isValidPassword(password)) {
      throw new Error('Contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
    }

    if (!isValidName(nombre)) {
      throw new Error('Nombre debe tener al menos 2 caracteres');
    }

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hash la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const user = await this.prisma.usuario.create({
      data: {
        email,
        nombre,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      activo: user.activo,
    };
  }

  /**
   * Inicia sesión un usuario
   */
  async login(email: string, password: string, tenantId: string) {
    // Validaciones
    if (!isValidEmail(email)) {
      throw new Error('Email o contraseña inválida');
    }

    console.log('🔍 [AuthService.login] Buscando usuario con email:', email);

    // Buscar el usuario
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user) {
      console.warn('⚠️ [AuthService.login] Usuario no encontrado:', email);
      throw new Error('Email o contraseña inválida');
    }

    if (!user.activo) {
      console.warn('⚠️ [AuthService.login] Usuario inactivo:', email);
      throw new Error('Usuario inactivo');
    }

    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.warn('⚠️ [AuthService.login] Contraseña inválida para:', email);
      throw new Error('Email o contraseña inválida');
    }

    console.log('✅ [AuthService.login] Usuario autenticado:', email);

    // Generar JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId,
    });

    // Generar refresh token y guardarlo en la BD
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      tenantId,
    });

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { refreshToken: hashToken(refreshToken) },
    });

    console.log('✅ [AuthService.login] Token generado con tenantId:', tenantId);

    // Extraer nombres de roles y permisos (merge de todos los roles)
    const roleNames = user.roles.map(ur => ur.rol.nombre);
    const firstRoleName = roleNames.length > 0 ? roleNames[0] : undefined;

    // Merge de permisos de todos los roles (evitar duplicados)
    const allPermisos = new Set<string>();
    for (const ur of user.roles) {
      const rolPermisos = ur.rol.permisos;
      let parsedPermisos: string[] = [];
      if (typeof rolPermisos === 'string') {
        try { parsedPermisos = JSON.parse(rolPermisos); } catch (e) { parsedPermisos = []; }
      } else if (Array.isArray(rolPermisos)) {
        parsedPermisos = rolPermisos;
      }
      parsedPermisos.forEach(p => allPermisos.add(p));
    }
    const permisos = Array.from(allPermisos);

    return {
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        activo: user.activo,
        roles: roleNames,
        rol: firstRoleName, // Para compatibilidad con frontend
        rol_id: user.roles.length > 0 ? user.roles[0].rolId : undefined,
        permisos: permisos, // Incluir permisos del rol
      },
    };
  }

  /**
   * Obtiene un usuario por ID
   */
  async getUserById(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const roleNames = user.roles.map(ur => ur.rol.nombre);
    const firstRoleName = roleNames.length > 0 ? roleNames[0] : undefined;

    // Merge de permisos de todos los roles (evitar duplicados)
    const allPermisos = new Set<string>();
    for (const ur of user.roles) {
      const rolPermisos = ur.rol.permisos;
      let parsedPermisos: string[] = [];
      if (typeof rolPermisos === 'string') {
        try { parsedPermisos = JSON.parse(rolPermisos); } catch (e) { parsedPermisos = []; }
      } else if (Array.isArray(rolPermisos)) {
        parsedPermisos = rolPermisos;
      }
      parsedPermisos.forEach(p => allPermisos.add(p));
    }
    const permisos = Array.from(allPermisos);

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      activo: user.activo,
      roles: roleNames,
      rol: firstRoleName, // Para compatibilidad con frontend
      rol_id: user.roles.length > 0 ? user.roles[0].rolId : undefined,
      permisos: permisos, // Incluir permisos del rol
    };
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }

    if (!isValidPassword(newPassword)) {
      throw new Error('Nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
    }

    // Hash nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar usuario
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada' };
  }
}
