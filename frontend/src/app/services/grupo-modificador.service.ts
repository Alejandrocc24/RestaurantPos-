import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Modificador {
  id: string | number;
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
      modificadores: g.modificadores ? g.modificadores.map((m: any) => ({
        ...m,
        estado: m.activo ? 'activo' : 'inactivo',
        categoria: m.categoria ?? null
      })) : []
    };
  }

  private mapToDbGrupo(grupo: GrupoModificador, isUpdate: boolean = false): any {
    const dbGrupo = {
      ...grupo,
      activo: grupo.estado === 'activo',
      cobrar_precio: grupo.cobrarPrecio ?? false,
      modificadores: grupo.modificadores ? grupo.modificadores.map((m: Modificador) => ({
        ...m,
        activo: m.estado === 'activo',
        categoria: m.categoria ?? null
      })) : []
    };
    // Omitir campos no en DB
    delete (dbGrupo as any).estado;
    delete (dbGrupo as any).cobrarPrecio;
    delete (dbGrupo as any).id; // Always omit id from group
    (dbGrupo.modificadores as any[]).forEach((m: any) => {
      delete m.estado;
      delete m.id; // Always omit id from modifiers to avoid conflicts
    });

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
