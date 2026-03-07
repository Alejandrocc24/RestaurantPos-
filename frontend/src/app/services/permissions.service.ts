import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private userPermissions: string[] = [];
  private userRole: string = '';
  private readonly defaultRolePermissions: Record<string, string[]> = {
    admin: [
      'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
      'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
      'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
      'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
      'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
      'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.dividir', 'mesas.modo_edicion',
      'cocina.ver', 'cocina.preparar', 'cocina.completar',
      'caja.ver', 'caja.abrir', 'caja.cerrar', 'movimientos.ver', 'movimientos.crear',
      'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
      'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.eliminar',
      'dashboard.ver', 'reportes.ver', 'reportes.ventas', 'reportes.productos', 'reportes.gastos', 'reportes.exportar',
      'configuracion.ver', 'configuracion.editar', 'configuracion.impresoras'
    ],
    gerente: [
      'usuarios.ver', 'usuarios.editar',
      'productos.ver', 'productos.editar',
      'categorias.ver',
      'ventas.ver', 'ventas.crear',
      'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
      'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.modo_edicion',
      'cocina.ver', 'cocina.preparar', 'cocina.completar',
      'caja.ver', 'movimientos.ver',
      'gastos.ver', 'gastos.crear', 'gastos.editar',
      'proveedores.ver',
      'dashboard.ver', 'reportes.ver',
      'configuracion.ver'
    ],
    cajero: [
      'ventas.ver', 'ventas.crear',
      'pedidos.ver', 'pedidos.crear', 'pedidos.editar',
      'mesas.ver', 'mesas.gestionar',
      'caja.ver', 'caja.abrir', 'caja.cerrar', 'movimientos.ver', 'movimientos.crear'
    ],
    cocina: [
      'cocina.ver', 'cocina.preparar', 'cocina.completar',
      'pedidos.ver'
    ],
    vendedor: [
      'ventas.ver', 'ventas.crear',
      'pedidos.ver', 'pedidos.crear',
      'mesas.ver',
      'productos.ver',
      'clientes.ver'
    ]
  };

  constructor(private authService: AuthService) {
    this.loadUserPermissions();
  }

  /**
   * Normaliza el nombre del rol desde la BD a la clave interna usada para permisos por defecto.
   * Ejemplo: 'Administrador' → 'admin', 'Gerente' → 'gerente', 'Cajero' → 'cajero'
   */
  private normalizeRoleName(roleName: string): string {
    const roleMap: Record<string, string> = {
      'administrador': 'admin',
      'admin': 'admin',
      'gerente': 'gerente',
      'cajero': 'cajero',
      'cocina': 'cocina',
      'vendedor': 'vendedor',
    };
    return roleMap[roleName.toLowerCase()] || roleName.toLowerCase();
  }

  private loadUserPermissions(): void {
    const user = this.authService.getUser();
    if (user) {
      const rawRole = (user.roles && user.roles.length > 0) ? user.roles[0] : (user.rol || '');
      this.userRole = this.normalizeRoleName(rawRole);
      // Priorizar permisos del rol desde la base de datos
      let permisosDelBackend = user.permisos || [];

      // Si los permisos vienen como string JSON, parsearlos
      if (typeof permisosDelBackend === 'string') {
        try {
          permisosDelBackend = JSON.parse(permisosDelBackend);
        } catch (e) {
          console.error('Error al parsear permisos:', e);
          permisosDelBackend = [];
        }
      }

      // Asegurar que sea un array
      if (!Array.isArray(permisosDelBackend)) {
        permisosDelBackend = [];
      }

      // Si hay permisos del backend, usarlos directamente (son los del rol desde la BD)
      if (permisosDelBackend.length > 0) {
        this.userPermissions = [...permisosDelBackend];
      } else {
        // Solo usar permisos por defecto si no hay permisos del rol en la BD
        const defaultPermissions = this.getDefaultPermissionsForRole(this.userRole);
        this.userPermissions = [...defaultPermissions];
      }

      // Asegurar que admin siempre tenga mesas.modo_edicion en su lista de permisos
      if (this.userRole === 'admin' && !this.userPermissions.includes('mesas.modo_edicion')) {
        this.userPermissions.push('mesas.modo_edicion');
      }

      console.log('🔐 Permisos cargados para rol', this.userRole, '(raw:', rawRole, '):', this.userPermissions);
    }
  }

  private getDefaultPermissionsForRole(role: string): string[] {
    return this.defaultRolePermissions[role] ? [...this.defaultRolePermissions[role]] : [];
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    // Admin siempre tiene todos los permisos
    if (this.userRole === 'admin') {
      return true;
    }

    return this.userPermissions.includes(permission);
  }

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  hasAnyPermission(permissions: string[]): boolean {
    if (this.userRole === 'admin') {
      return true;
    }

    return permissions.some(permission => this.userPermissions.includes(permission));
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (this.userRole === 'admin') {
      return true;
    }

    return permissions.every(permission => this.userPermissions.includes(permission));
  }

  /**
   * Obtiene todos los permisos del usuario actual
   */
  getUserPermissions(): string[] {
    return [...this.userPermissions];
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getUserRole(): string {
    return this.userRole;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  /**
   * Actualiza los permisos del usuario (llamar después de login o cambio de rol)
   */
  refreshPermissions(): void {
    this.loadUserPermissions();
  }

  /**
   * Limpia los permisos (llamar en logout)
   */
  clearPermissions(): void {
    this.userPermissions = [];
    this.userRole = '';
  }

  /**
   * Verifica permisos por módulo
   */
  canAccessModule(module: string): boolean {
    const modulePermissions: { [key: string]: string[] } = {
      'usuarios': ['usuarios.ver'],
      'roles': ['roles.ver'],
      'productos': ['productos.ver'],
      'categorias': ['categorias.ver'],
      'ventas': ['ventas.ver'],
      'pedidos': ['pedidos.ver'],
      'mesas': ['mesas.ver'],
      'cocina': ['cocina.ver'],
      'caja': ['caja.ver'],
      'movimientos': ['movimientos.ver'],
      'gastos': ['gastos.ver'],
      'proveedores': ['proveedores.ver'],
      'reportes': ['reportes.ver', 'dashboard.ver'],
      'configuracion': ['configuracion.ver']
    };

    const requiredPermissions = modulePermissions[module];
    if (!requiredPermissions) {
      return false;
    }

    return this.hasAnyPermission(requiredPermissions);
  }

  /**
   * Verifica si puede realizar una acción específica
   */
  canPerformAction(action: string): boolean {
    return this.hasPermission(action);
  }
}
