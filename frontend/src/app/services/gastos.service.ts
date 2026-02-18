import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, map } from 'rxjs';
import { Gasto, CategoriaGasto, ApiResponse } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  constructor(private apiService: ApiService) { }

  /**
   * Obtener todos los gastos con paginación
   */
  getGastos(skip: number = 0, take: number = 50): Observable<Gasto[]> {
    return this.apiService.getGastos(skip, take).pipe(
      map((response: ApiResponse<Gasto[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener gasto por ID
   */
  getGastoById(id: string | number): Observable<Gasto | null> {
    return this.apiService.getGastoById(id.toString()).pipe(
      map((response: ApiResponse<Gasto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Crear nuevo gasto
   */
  createGasto(data: Partial<Gasto>): Observable<Gasto | null> {
    return this.apiService.createGasto(data).pipe(
      map((response: ApiResponse<Gasto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar gasto
   */
  updateGasto(id: string | number, data: Partial<Gasto>): Observable<Gasto | null> {
    return this.apiService.updateGasto(id.toString(), data).pipe(
      map((response: ApiResponse<Gasto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Eliminar gasto
   */
  deleteGasto(id: string | number): Observable<boolean> {
    return this.apiService.deleteGasto(id.toString()).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }

  /**
   * Obtener todas las categorías de gastos
   */
  getCategoriasGastos(skip: number = 0, take: number = 50): Observable<CategoriaGasto[]> {
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
   * Obtener categoría de gasto por ID
   */
  getCategoriaGastoById(id: string | number): Observable<CategoriaGasto | null> {
    return this.apiService.getCategoriaGastoById(id.toString()).pipe(
      map((response: ApiResponse<CategoriaGasto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Crear nueva categoría de gasto
   */
  createCategoriaGasto(data: Partial<CategoriaGasto>): Observable<CategoriaGasto | null> {
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
  updateCategoriaGasto(id: string | number, data: Partial<CategoriaGasto>): Observable<CategoriaGasto | null> {
    return this.apiService.updateCategoriaGasto(id.toString(), data).pipe(
      map((response: ApiResponse<CategoriaGasto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Eliminar categoría de gasto
   */
  deleteCategoriaGasto(id: string | number): Observable<boolean> {
    return this.apiService.deleteCategoriaGasto(id.toString()).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }

  /**
   * Obtener proveedores (usando método genérico)
   */
  getProveedores(): Observable<any[]> {
    return this.apiService.getData('proveedores').pipe(
      map((response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Crear proveedor (usando método genérico)
   */
  createProveedor(data: any): Observable<any> {
    return this.apiService.insertData('proveedores', data);
  }
}
