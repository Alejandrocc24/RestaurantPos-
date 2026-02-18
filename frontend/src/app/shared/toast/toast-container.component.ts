import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toasts.length > 0">
      <div class="toast" *ngFor="let t of toasts"
           [class.toast-success]="t.tipo === 'success'"
           [class.toast-error]="t.tipo === 'error'"
           [class.toast-warning]="t.tipo === 'warning'"
           [class.toast-info]="t.tipo === 'info'">
        <div class="toast-icon">
          <i class="fas" 
             [ngClass]="{
               'fa-check-circle': t.tipo === 'success',
               'fa-exclamation-circle': t.tipo === 'error',
               'fa-exclamation-triangle': t.tipo === 'warning',
               'fa-info-circle': t.tipo === 'info'
             }"></i>
        </div>
        <div class="toast-body">
          <strong class="toast-title">{{ t.titulo }}</strong>
          <div class="toast-message">{{ t.mensaje }}</div>
        </div>
        <button class="toast-close" (click)="cerrar(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 1100; }
    .toast { display: flex; align-items: flex-start; gap: 10px; min-width: 260px; max-width: 360px; background: #fff; border-left: 5px solid #3b82f6; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 12px 12px 12px 10px; animation: slideIn .25s ease; }
    .toast-icon { font-size: 20px; line-height: 1; margin-top: 2px; color: #3b82f6; }
    .toast-body { flex: 1; }
    .toast-title { display: block; font-weight: 600; color: #111827; margin-bottom: 2px; }
    .toast-message { color: #374151; font-size: 14px; }
    .toast-close { background: transparent; border: none; color: #6b7280; font-size: 18px; cursor: pointer; padding: 0 4px; }
    .toast-success { border-left-color: #10b981; } .toast-success .toast-icon { color: #10b981; }
    .toast-error { border-left-color: #ef4444; } .toast-error .toast-icon { color: #ef4444; }
    .toast-warning { border-left-color: #f59e0b; } .toast-warning .toast-icon { color: #f59e0b; }
    .toast-info { border-left-color: #3b82f6; } .toast-info .toast-icon { color: #3b82f6; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toasts$.subscribe((evt: any) => {
      if (evt?.dismiss) {
        this.toasts = this.toasts.filter(t => t.id !== evt.id);
      } else if (evt) {
        this.toasts = [...this.toasts, evt as Toast];
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  cerrar(id: number) {
    this.toastService.dismiss(id);
  }
}
