import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Salon } from '../types/api.models';

@Injectable({ providedIn: 'root' })
export class ZonaService {
  private zonaSource = new BehaviorSubject<string>('salon');
  zona$ = this.zonaSource.asObservable();

  private filtroSource = new BehaviorSubject<string>('todas');
  filtro$ = this.filtroSource.asObservable();

  private modoEdicionSource = new BehaviorSubject<boolean>(false);
  modoEdicion$ = this.modoEdicionSource.asObservable();

  private gestionarSalonesSource = new BehaviorSubject<boolean>(false);
  gestionarSalones$ = this.gestionarSalonesSource.asObservable();

  private nuevaMesaSource = new BehaviorSubject<boolean>(false);
  nuevaMesa$ = this.nuevaMesaSource.asObservable();

  private salonesSource = new BehaviorSubject<Salon[]>([]);
  salones$ = this.salonesSource.asObservable();

  constructor(private apiService: ApiService) {
    this.cargarSalones();
  }

  private async cargarSalones(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getSalones());
      if (response.success && response.data) {
        this.salonesSource.next(response.data);
      }
    } catch {
      this.salonesSource.next([]);
    }
  }

  getSalones(): string[] {
    return this.salonesSource.value.map(s => s.nombre);
  }

  getSalonesCompletos(): Salon[] {
    return this.salonesSource.value;
  }

  async agregarSalon(nombre: string): Promise<boolean> {
    const normalized = nombre.trim().toLowerCase();
    if (!normalized || normalized === 'mostrador' || normalized === 'domicilio') return false;
    if (this.getSalones().includes(normalized)) return false;

    try {
      const response = await firstValueFrom(this.apiService.createSalon({ nombre: normalized }));
      if (response.success && response.data) {
        const current = this.salonesSource.value;
        this.salonesSource.next([...current, response.data]);
        this.setZona(normalized);
        return true;
      }
    } catch {}
    return false;
  }

  async actualizarSalon(id: string, nuevoNombre: string): Promise<boolean> {
    const normalized = nuevoNombre.trim().toLowerCase();
    if (!normalized || normalized === 'mostrador' || normalized === 'domicilio') return false;
    if (this.getSalones().includes(normalized)) return false;

    try {
      const response = await firstValueFrom(this.apiService.updateSalon(id, { nombre: normalized }));
      if (response.success && response.data) {
        const salonActualizado = response.data;
        const current = this.salonesSource.value;
        const updated = current.map(s => s.id === id ? salonActualizado : s);
        this.salonesSource.next(updated);
        if (this.getZona() === current.find(s => s.id === id)?.nombre) {
          this.setZona(normalized);
        }
        return true;
      }
    } catch {}
    return false;
  }

  async eliminarSalon(nombre: string): Promise<boolean> {
    const salon = this.salonesSource.value.find(s => s.nombre === nombre);
    if (!salon) return false;
    const currentNombre = salon.nombre;

    try {
      const response = await firstValueFrom(this.apiService.deleteSalon(salon.id));
      if (response.success) {
        const updated = this.salonesSource.value.filter(s => s.id !== salon.id);
        this.salonesSource.next(updated);
        if (this.getZona() === currentNombre) {
          this.setZona(updated[0]?.nombre || 'mostrador');
        }
        return true;
      }
    } catch {}
    return false;
  }

  getZonasDisponibles(): string[] {
    return [...this.getSalones(), 'mostrador', 'domicilio'];
  }

  esSalon(zona: string): boolean {
    return this.getSalones().includes(zona);
  }

  setZona(zona: string): void {
    this.zonaSource.next(zona);
  }

  getZona(): string {
    return this.zonaSource.value;
  }

  setFiltro(filtro: string): void {
    this.filtroSource.next(filtro);
  }

  getFiltro(): string {
    return this.filtroSource.value;
  }

  toggleModoEdicion(): void {
    this.modoEdicionSource.next(!this.modoEdicionSource.value);
  }

  setModoEdicion(value: boolean): void {
    this.modoEdicionSource.next(value);
  }

  getModoEdicion(): boolean {
    return this.modoEdicionSource.value;
  }

  abrirGestionarSalones(): void {
    this.gestionarSalonesSource.next(true);
  }

  cerrarGestionarSalones(): void {
    this.gestionarSalonesSource.next(false);
  }

  abrirNuevaMesa(): void {
    this.nuevaMesaSource.next(true);
  }

  cerrarNuevaMesa(): void {
    this.nuevaMesaSource.next(false);
  }
}
