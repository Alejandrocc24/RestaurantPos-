import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Usuario, LoginResponse, ApiResponse } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = new BehaviorSubject<Usuario | null>(null);
  private baseUrl = environment.apiUrl;

  constructor(private router: Router, private http: HttpClient) {
    this.restoreSession();
  }

  /**
   * Inicia sesión con email, password y tenantId
   * El backend devuelve el token en la respuesta
   */
  async signIn(email: string, password: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, {
          email,
          password,
          tenantId,
        }, { withCredentials: true }),
      );

      if (response.success && response.data) {
        const { accessToken, user } = response.data;

        console.log('✅ [AuthService] Login exitoso');
        console.log('  - Token recibido:', !!accessToken);
        console.log('  - Usuario:', user.nombre || user.name);
        console.log('  - Roles:', user.roles);

        // Guardar token y tenantId en sessionStorage (solo disponible en navegador)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('tenantId', tenantId);
          localStorage.setItem('user', JSON.stringify(user));

          console.log('✅ [AuthService] Datos guardados en localStorage');
          console.log('  - Token guardado:', !!localStorage.getItem('token'));
          console.log('  - TenantId guardado:', localStorage.getItem('tenantId'));
          console.log('  - Usuario guardado:', !!localStorage.getItem('user'));
        } else {
          console.warn('⚠️ [AuthService] No se pudo guardar en localStorage (SSR)');
        }

        // Actualizar estado
        this.currentUser.next(user);

        return { success: true };
      }

      return { success: false, error: response.message || 'Error de autenticación' };
    } catch (error: any) {
      console.error('Error en signIn:', error);
      const errorMsg = error?.error?.message || error?.message || 'Error inesperado';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async signOut(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true }));
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar localStorage sin importar si el request tuvo éxito
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('user');
      this.currentUser.next(null);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Restaurar sesión desde sessionStorage si existe
   */
  restoreSession(): void {
    // Solo ejecutar en el navegador, no en SSR
    if (typeof window === 'undefined') {
      console.log('🔄 [AuthService] SSR - omitiendo restoreSession');
      return;
    }

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    console.log('🔄 [AuthService] restoreSession intentando restaurar...');
    console.log('  - User en storage:', !!userStr);
    console.log('  - Token en storage:', !!token);

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr) as Usuario;
        if (user && user.email) {
          this.currentUser.next(user);
          console.log('✅ [AuthService] Sesión restaurada desde localStorage');
          console.log('  - Usuario:', user.nombre || user.name);
          console.log('  - Roles:', user.roles);
          console.log('  - Rol:', user.rol);
          return;
        }
      } catch (error) {
        console.error('[AuthService] Error al restaurar sesión:', error);
      }
    }

    // Don't clear localStorage here - preserve token even if user object is missing
    console.warn('⚠️ [AuthService] No se pudo restaurar el usuario, pero manteniendo el token');
    this.currentUser.next(null);
  }

  /**
   * Obtener usuario actual como Observable
   */
  getCurrentUser(): Observable<Usuario | null> {
    return this.currentUser.asObservable();
  }

  /**
   * Verificar si está autenticado - revisa sessionStorage en el navegador
   */
  isAuthenticated(): boolean {
    // Verificar que estamos en el navegador
    if (typeof window === 'undefined') {
      console.log('🔐 [AuthService] SSR - no autenticado');
      return false;
    }

    const token = localStorage.getItem('token');
    const user = this.currentUser.value;

    console.log('🔐 [AuthService.isAuthenticated] Token exists:', !!token, 'User exists:', !!user);

    return !!token && user !== null;
  }

  /**
   * Obtener usuario actual de forma síncrona
   */
  getUser(): Usuario | null {
    return this.currentUser.value;
  }

  /**
   * Obtener token de forma síncrona - solo en navegador
   */
  getToken(): string | null {
    if (typeof window === 'undefined') {
      console.log('🔐 [AuthService.getToken] SSR - sin token disponible');
      return null;
    }

    const token = localStorage.getItem('token');
    console.log('🔐 [AuthService.getToken] Token disponible:', !!token);
    return token;
  }

  /**
   * Obtener tenantId de forma síncrona
   */
  getTenantId(): string | null {
    if (typeof window === 'undefined') {
      console.log('🔐 [AuthService.getTenantId] SSR - sin tenantId disponible');
      return null;
    }

    return localStorage.getItem('tenantId');
  }
}
