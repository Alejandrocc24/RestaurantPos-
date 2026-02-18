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
   * Obtener todas las categorías de gastos
   */
  getCategorias(skip: number = 0, take: number = 50): Observable<CategoriaGasto[]> {
    return this.apiService.getCategoriasGastos(skip, take).pipe(
      map((response: ApiResponse<CategoriaGasto[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Crear nueva categoría de gasto
   */
  crearCategoria(data: Partial<CategoriaGasto>): Observable<CategoriaGasto | null> {
    return this.apiService.createCategoriaGasto(data).pipe(
      map((response: ApiResponse<CategoriaGasto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar categoría de gasto
   */
  actualizarCategoria(id: string, data: Partial<CategoriaGasto>): Observable<CategoriaGasto | null> {
    return this.apiService.updateCategoriaGasto(id, data).pipe(
      map((response: ApiResponse<CategoriaGasto>) => {
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
  cambiarEstado(id: string, activo: boolean): Observable<CategoriaGasto | null> {
    return this.actualizarCategoria(id, { activo });
  }

  /**
   * Eliminar categoría de gasto
   */
  eliminarCategoria(id: string): Observable<boolean> {
    return this.apiService.deleteCategoriaGasto(id).pipe(
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
