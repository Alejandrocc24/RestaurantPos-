import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Modificador {
  id: string | number;
  productoId?: string | null;
  nombre: string;
  precio: number;
  estado: 'activo' | 'inactivo';
  categoria?: string | null;
}

export interface GrupoModificador {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo?: 'unico' | 'multiple';
  obligatorio?: boolean;
  estado: 'activo' | 'inactivo';
  modificadores: Modificador[];
  maxSelecciones?: number;
  minSelecciones?: number;
  cobrarPrecio?: boolean; // Campo local, no en DB
}

@Injectable({
  providedIn: 'root'
})
export class GrupoModificadorService {
  private apiUrl = `${environment.apiUrl}/grupos-modificadores`;

  private gruposSubject = new BehaviorSubject<GrupoModificador[]>([]);
  public grupos$ = this.gruposSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return {
      'Content-Type': 'application/json'
    };
  }

  private mapToGrupo(g: any): GrupoModificador {
    return {
      ...g,
      estado: g.activo ? 'activo' : 'inactivo',
      cobrarPrecio: g.cobrarPrecio ?? g.cobrar_precio ?? false,
      modificadores: g.opciones ? g.opciones.map((m: any) => ({
        id: m.id,
        productoId: m.productoId ?? m.producto_id ?? null,
        nombre: m.nombre,
        precio: Number(m.precioAdicional ?? m.precio_adicional ?? m.precio ?? 0) || 0,
        estado: m.activo ? 'activo' : 'inactivo',
        categoria: m.categoria ?? null
      })) : []
    };
  }

  private mapToDbGrupo(grupo: GrupoModificador, isUpdate: boolean = false): any {
    const dbGrupo: any = {
      nombre: grupo.nombre.trim(),
      requerido: (grupo as any).obligatorio ?? false,
      activo: grupo.estado === 'activo',
      cobrar_precio: grupo.cobrarPrecio ?? false
    };

    // Solo agregar descripcion si tiene valor (evitar undefined)
    const descripcion = (grupo as any).descripcion?.trim();
    if (descripcion) {
      dbGrupo.descripcion = descripcion;
    }

    // Mapear modificadores a 'opciones' esperado por el backend (Prisma)
    // IMPORTANTE: Esto reemplaza todas las opciones existentes
    if (grupo.modificadores && Array.isArray(grupo.modificadores) && grupo.modificadores.length > 0) {
      dbGrupo.opciones = grupo.modificadores.map((m: Modificador & { productoId?: string | null }) => ({
        nombre: m.nombre.trim(),
        precioAdicional: typeof (m.precio) === 'number' ? m.precio : Number(m.precio) || 0,
        activo: m.estado === 'activo',
        productoId: m.productoId ?? null,
        categoria: m.categoria ?? null
      }));
    } else {
      // Si no hay modificadores, incluir array vacío para reemplazar opciones existentes
      dbGrupo.opciones = [];
    }

    console.log('📤 [mapToDbGrupo] Payload enviado al backend:', JSON.stringify(dbGrupo, null, 2));
    return dbGrupo;
  }

  // Obtener todos los grupos modificadores
  getGruposModificadores(): Observable<GrupoModificador[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener grupos modificadores');
        }
        const grupos = response.data.map((g: any) => this.mapToGrupo(g));
        this.gruposSubject.next(grupos);
        return grupos;
      })
    );
  }

  // Obtener un grupo modificador por ID
  getGrupoModificador(id: string): Observable<GrupoModificador> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener grupo modificador');
        }
        return this.mapToGrupo(response.data);
      })
    );
  }

  // Crear un nuevo grupo modificador
  crearGrupoModificador(grupo: GrupoModificador): Observable<GrupoModificador> {
    const grupoData = this.mapToDbGrupo(grupo);
    return this.http.post<any>(this.apiUrl, grupoData, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al crear grupo modificador');
        }
        const nuevoGrupo = this.mapToGrupo(response.data);
        const gruposActuales = this.gruposSubject.value;
        this.gruposSubject.next([...gruposActuales, nuevoGrupo]);
        return nuevoGrupo;
      })
    );
  }

  // Actualizar un grupo modificador existente
  actualizarGrupoModificador(id: string, grupo: Partial<GrupoModificador>): Observable<GrupoModificador> {
    const grupoData = this.mapToDbGrupo(grupo as GrupoModificador);
    return this.http.patch<any>(`${this.apiUrl}/${id}`, grupoData, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al actualizar grupo modificador');
        }
        const grupoActualizado = this.mapToGrupo(response.data);
        const gruposActuales = this.gruposSubject.value;
        const index = gruposActuales.findIndex(g => g.id === id);
        if (index !== -1) {
          const updated = [...gruposActuales];
          updated[index] = grupoActualizado;
          this.gruposSubject.next(updated);
        }
        return grupoActualizado;
      })
    );
  }

  // Eliminar un grupo modificador
  eliminarGrupoModificador(id: string): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al eliminar grupo modificador');
        }
        const gruposActuales = this.gruposSubject.value;
        const gruposFiltrados = gruposActuales.filter(g => g.id !== id);
        this.gruposSubject.next(gruposFiltrados);
      })
    );
  }

  // Cambiar el estado de un grupo modificador
  cambiarEstado(id: string, nuevoEstado: 'activo' | 'inactivo'): Observable<GrupoModificador> {
    return this.actualizarGrupoModificador(id, { estado: nuevoEstado });
  }

  // Obtener grupos modificadores por estado
  getGruposPorEstado(estado: 'activo' | 'inactivo'): Observable<GrupoModificador[]> {
    const activo = estado === 'activo';
    return this.http.get<any>(`${this.apiUrl}?activo=eq.${activo}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener grupos por estado');
        }
        return response.data.map((g: any) => this.mapToGrupo(g));
      })
    );
  }

  // Obtener grupos modificadores por tipo
  getGruposPorTipo(tipo: 'unico' | 'multiple'): Observable<GrupoModificador[]> {
    return this.http.get<any>(`${this.apiUrl}?tipo=eq.${tipo}`, { headers: this.getHeaders() }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener grupos por tipo');
        }
        return response.data.map((g: any) => this.mapToGrupo(g));
      })
    );
  }
}
