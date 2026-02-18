import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  tipo: ToastType;
  titulo: string;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private toastsSubject = new Subject<Toast | { id: number; dismiss: true }>();
  toasts$ = this.toastsSubject.asObservable();

  show(titulo: string, mensaje?: string, tipo: ToastType = 'info', autoCloseMs = 4500) {
    const id = ++this.seq;
    this.toastsSubject.next({ id, tipo, titulo, mensaje });
    if (autoCloseMs > 0) {
      setTimeout(() => this.dismiss(id), autoCloseMs);
    }
  }

  success(titulo: string, mensaje?: string) { this.show(titulo, mensaje, 'success'); }
  error(titulo: string, mensaje?: string) { this.show(titulo, mensaje, 'error'); }
  warning(titulo: string, mensaje?: string) { this.show(titulo, mensaje, 'warning'); }
  info(titulo: string, mensaje?: string) { this.show(titulo, mensaje, 'info'); }

  dismiss(id: number) {
    this.toastsSubject.next({ id, dismiss: true } as any);
  }
}
