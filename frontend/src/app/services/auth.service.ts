import { Injectable, NgZone } from '@angular/core';
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
  private tokenExpiryTimer: any = null;

  constructor(private router: Router, private http: HttpClient, private ngZone: NgZone) {
    this.restoreSession();
  }

  /**
   * Inicia sesión con email, password y tenantId
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

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('tenantId', tenantId);
          localStorage.setItem('user', JSON.stringify(user));
        }

        this.currentUser.next(user);

        // Programar cierre de sesión automático
        this.scheduleAutoLogout(accessToken);

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
      // Ignorar errores del backend al cerrar sesión
    } finally {
      this.clearSession();
    }
  }

  /**
   * Limpia la sesión local y redirige al login
   */
  private clearSession(): void {
    this.clearExpiryTimer();
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('user');
    this.currentUser.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Restaurar sesión desde localStorage si existe y el token es válido
   */
  restoreSession(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userStr && token) {
      // Verificar si el token ha expirado
      if (this.isTokenExpired(token)) {
        console.warn('⚠️ [AuthService] Token expirado, cerrando sesión automáticamente');
        this.clearSession();
        return;
      }

      try {
        const user = JSON.parse(userStr) as Usuario;
        if (user && user.email) {
          this.currentUser.next(user);
          console.log('✅ [AuthService] Sesión restaurada');
          // Programar cierre de sesión automático con el token existente
          this.scheduleAutoLogout(token);
          return;
        }
      } catch (error) {
        console.error('[AuthService] Error al restaurar sesión:', error);
      }
    }

    this.currentUser.next(null);
  }

  /**
   * Decodifica el payload de un JWT sin verificar la firma
   */
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    const expiresAt = decoded.exp * 1000;
    return Date.now() >= expiresAt;
  }

  /**
   * Programa un cierre de sesión automático cuando el token expire
   */
  private scheduleAutoLogout(token: string): void {
    this.clearExpiryTimer();

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return;

    const expiresAt = decoded.exp * 1000;
    const msHastaExpiracion = expiresAt - Date.now();

    if (msHastaExpiracion <= 0) {
      console.warn('⚠️ [AuthService] Token ya expirado, cerrando sesión');
      this.clearSession();
      return;
    }

    const minutosRestantes = Math.round(msHastaExpiracion / 60000);
    console.log(`⏰ [AuthService] Sesión expirará en ${minutosRestantes} minutos`);

    // Ejecutar fuera de la zona de Angular para no disparar change detection
    this.ngZone.runOutsideAngular(() => {
      this.tokenExpiryTimer = setTimeout(() => {
        this.ngZone.run(() => {
          console.warn('⏰ [AuthService] Token expirado, cerrando sesión automáticamente');
          this.clearSession();
        });
      }, msHastaExpiracion);
    });
  }

  /**
   * Limpia el timer de expiración
   */
  private clearExpiryTimer(): void {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
  }

  getCurrentUser(): Observable<Usuario | null> {
    return this.currentUser.asObservable();
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');
    const user = this.currentUser.value;

    // Además de existir, verificar que no haya expirado
    if (token && this.isTokenExpired(token)) {
      console.warn('⚠️ [AuthService] Token expirado en isAuthenticated()');
      this.clearSession();
      return false;
    }

    return !!token && user !== null;
  }

  getUser(): Usuario | null {
    return this.currentUser.value;
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  getTenantId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tenantId');
  }
}
