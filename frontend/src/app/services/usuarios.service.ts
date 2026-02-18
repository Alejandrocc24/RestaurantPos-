import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, ApiResponse } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtener todos los usuarios con paginación
   */
  getUsuarios(skip: number = 0, take: number = 50): Observable<Usuario[]> {
    return this.apiService.getUsuarios(skip, take).pipe(
      map((response: ApiResponse<Usuario[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener usuario por ID
   */
  getUsuarioById(id: string): Observable<Usuario | null> {
    return this.apiService.getUsuarioById(id).pipe(
      map((response: ApiResponse<Usuario>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Crear nuevo usuario
   */
  createUsuario(data: Partial<Usuario>): Observable<Usuario | null> {
    return this.apiService.createUsuario(data).pipe(
      map((response: ApiResponse<Usuario>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar usuario
   */
  updateUsuario(id: string, data: Partial<Usuario>): Observable<Usuario | null> {
    return this.apiService.updateUsuario(id, data).pipe(
      map((response: ApiResponse<Usuario>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Cambiar estado de usuario (activo/inactivo)
   */
  updateEstadoUsuario(id: string, activo: boolean): Observable<Usuario | null> {
    return this.updateUsuario(id, { activo });
  }

  /**
   * Actualizar roles de usuario
   */
  updateRolesUsuario(id: string, roles: string[]): Observable<Usuario | null> {
    return this.updateUsuario(id, { roles });
  }

  /**
   * Eliminar usuario
   */
  deleteUsuario(id: string): Observable<boolean> {
    return this.apiService.deleteUsuario(id).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }

  /**
   * Obtener usuario actual desde el AuthService
   */
  getUsuarioActual(): Observable<Usuario | null> {
    // Este método se implementaría con AuthService
    return new Observable(observer => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          observer.next(JSON.parse(userStr));
        } catch (error) {
          observer.next(null);
        }
      } else {
        observer.next(null);
      }
      observer.complete();
    });
  }
}
