import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../types/api.models';

export interface Proveedor {
  id?: string;
  nombre: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  created_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtener todos los proveedores
   */
  getProveedores(skip: number = 0, take: number = 50): Observable<Proveedor[]> {
    return this.apiService.getData('proveedores').pipe(
      map((response: ApiResponse<Proveedor[]>) => {
        if (response.success && response.data) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      })
    );
  }

  /**
   * Obtener proveedor por ID
   */
  getProveedorById(id: string): Observable<Proveedor | null> {
    return this.apiService.getData(`proveedores/${id}`).pipe(
      map((response: ApiResponse<Proveedor>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Crear nuevo proveedor
   */
  createProveedor(data: Partial<Proveedor>): Observable<Proveedor | null> {
    return this.apiService.insertData('proveedores', data).pipe(
      map((response: ApiResponse<Proveedor>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar proveedor
   */
  updateProveedor(id: string, data: Partial<Proveedor>): Observable<Proveedor | null> {
    return this.apiService.updateData('proveedores', { id }, data).pipe(
      map((response: ApiResponse<Proveedor>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Eliminar proveedor
   */
  deleteProveedor(id: string): Observable<boolean> {
    return this.apiService.deleteData('proveedores', { id }).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }
}
