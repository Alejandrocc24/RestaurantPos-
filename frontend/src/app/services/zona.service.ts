import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
