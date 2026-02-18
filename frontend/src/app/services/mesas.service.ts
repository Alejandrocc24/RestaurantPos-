import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Mesa, ApiResponse } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class MesasService {
  constructor(private apiService: ApiService) {}

  /**
   * Obtener todas las mesas con paginación
   */
  getMesas(skip: number = 0, take: number = 50): Observable<Mesa[]> {
    return this.apiService.getMesas(skip, take).pipe(
      map((response: ApiResponse<Mesa[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener mesa por ID
   */
  getMesaById(id: string): Observable<Mesa | null> {
    return this.apiService.getMesaById(id).pipe(
      map((response: ApiResponse<Mesa>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Crear nueva mesa
   */
  createMesa(data: Partial<Mesa>): Observable<Mesa | null> {
    return this.apiService.createMesa(data).pipe(
      map((response: ApiResponse<Mesa>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar mesa
   */
  updateMesa(id: string, data: Partial<Mesa>): Observable<Mesa | null> {
    return this.apiService.updateMesa(id, data).pipe(
      map((response: ApiResponse<Mesa>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Cambiar estado de mesa (disponible, ocupada, reservada)
   */
  updateEstadoMesa(id: string, estado: 'disponible' | 'ocupada' | 'reservada'): Observable<Mesa | null> {
    return this.updateMesa(id, { estado });
  }

  /**
   * Eliminar mesa
   */
  deleteMesa(id: string): Observable<boolean> {
    return this.apiService.deleteMesa(id).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }
}
