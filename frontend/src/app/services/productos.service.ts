import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Producto, ApiResponse } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtener todos los productos con paginación
   */
  getProductos(skip: number = 0, take: number = 50): Observable<Producto[]> {
    return this.apiService.getProductos(skip, take).pipe(
      map((response: ApiResponse<Producto[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener producto por ID
   */
  getProductoById(id: string): Observable<Producto | null> {
    return this.apiService.getProductoById(id).pipe(
      map((response: ApiResponse<Producto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Obtener productos activos (útil para menú)
   */
  getProductosActivos(): Observable<Producto[]> {
    return this.getProductos(0, 2000);
  }

  /**
   * Crear nuevo producto
   */
  createProducto(data: Partial<Producto>): Observable<Producto | null> {
    return this.apiService.createProducto(data).pipe(
      map((response: ApiResponse<Producto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar producto
   */
  updateProducto(id: string, data: Partial<Producto>): Observable<Producto | null> {
    return this.apiService.updateProducto(id, data).pipe(
      map((response: ApiResponse<Producto>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Eliminar producto
   */
  deleteProducto(id: string): Observable<boolean> {
    return this.apiService.deleteProducto(id).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }
}
