import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { CategoriaGasto, ApiResponse } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtener todas las categorías de productos
   */
  getCategorias(skip: number = 0, take: number = 50): Observable<any[]> {
    return this.apiService.getCategorias(skip, take).pipe(
      map((response: ApiResponse<any[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Crear nueva categoría
   */
  crearCategoria(data: Partial<any>): Observable<any | null> {
    return this.apiService.createCategoria(data).pipe(
      map((response: ApiResponse<any>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar categoría
   */
  actualizarCategoria(id: string, data: Partial<any>): Observable<any | null> {
    return this.apiService.updateCategoria(id, data).pipe(
      map((response: ApiResponse<any>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Cambiar estado de categoría (activo/inactivo)
   */
  cambiarEstado(id: string, activo: boolean): Observable<any | null> {
    return this.actualizarCategoria(id, { activo });
  }

  /**
   * Eliminar categoría
   */
  eliminarCategoria(id: string): Observable<boolean> {
    return this.apiService.deleteCategoria(id).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }

  /**
   * Verificar que el nombre sea único (helper)
   */
  verificarNombreUnico(nombre: string, idExcluir?: string): Observable<boolean> {
    // Esta validación se haría idealmente en el backend
    // Por ahora, retornamos true como placeholder
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }
}
