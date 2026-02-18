import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Comentario {
  id?: string;
  ordenId: string;
  contenido: string;
  tipoComentario: 'GENERAL' | 'PROBLEMA' | 'COMENTARIO_CLIENTE' | 'NOTA_INTERNA' | 'ADVERTENCIA';
  severidad: 'BAJA' | 'NORMAL' | 'ALTA' | 'CRITICA';
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    skip: number;
    take: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ComentariosService {
  private apiUrl = `${environment.apiBaseUrl}/comentarios`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los comentarios
   */
  getComentarios(
    skip: number = 0,
    take: number = 50,
    ordenId?: string
  ): Observable<ApiResponse<Comentario[]>> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('take', take.toString());

    if (ordenId) {
      params = params.set('ordenId', ordenId);
    }

    return this.http.get<ApiResponse<Comentario[]>>(this.apiUrl, { params });
  }

  /**
   * Obtener comentario por ID
   */
  getComentario(id: string): Observable<ApiResponse<Comentario>> {
    return this.http.get<ApiResponse<Comentario>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener comentarios de una orden específica
   */
  getComentariosPorOrden(ordenId: string): Observable<ApiResponse<Comentario[]>> {
    return this.http.get<ApiResponse<Comentario[]>>(`${this.apiUrl}/orden/${ordenId}`);
  }

  /**
   * Crear nuevo comentario
   */
  createComentario(comentario: Comentario): Observable<ApiResponse<Comentario>> {
    return this.http.post<ApiResponse<Comentario>>(this.apiUrl, comentario);
  }

  /**
   * Actualizar comentario
   */
  updateComentario(
    id: string,
    comentario: Partial<Comentario>
  ): Observable<ApiResponse<Comentario>> {
    return this.http.put<ApiResponse<Comentario>>(`${this.apiUrl}/${id}`, comentario);
  }

  /**
   * Eliminar comentario (soft delete)
   */
  deleteComentario(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
