import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-modal-overlay" (click)="onCancelar()">
      <div class="confirm-modal-content" (click)="$event.stopPropagation()">
        <div class="confirm-modal-header" [ngClass]="'header-' + tipo">
          <div class="header-icon">
            <span *ngIf="tipo === 'danger'">⚠️</span>
            <span *ngIf="tipo === 'warning'">⚠️</span>
            <span *ngIf="tipo === 'info'">ℹ️</span>
          </div>
          <h3>{{ titulo }}</h3>
        </div>
        
        <div class="confirm-modal-body">
          <p>{{ mensaje }}</p>
        </div>
        
        <div class="confirm-modal-footer">
          <button class="btn btn-secondary" (click)="onCancelar()">
            {{ textoCancelar }}
          </button>
          <button class="btn" [ngClass]="'btn-' + tipo" (click)="onConfirmar()">
            {{ textoConfirmar }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease-out;
    }
    
    .confirm-modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 450px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    }
    
    .confirm-modal-header {
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .header-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    
    .header-danger {
      background-color: #fef2f2;
      border-bottom-color: #fecaca;
    }
    
    .header-warning {
      background-color: #fffbeb;
      border-bottom-color: #fed7aa;
    }
    
    .header-info {
      background-color: #eff6ff;
      border-bottom-color: #bfdbfe;
    }
    
    .confirm-modal-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 20px;
      font-weight: 600;
    }
    
    .confirm-modal-body {
      padding: 20px 24px;
    }
    
    .confirm-modal-body p {
      margin: 0;
      color: #495057;
      font-size: 16px;
      line-height: 1.5;
      white-space: pre-line;
    }
    
    .confirm-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px 24px;
      border-top: 1px solid #e9ecef;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      min-width: 80px;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-danger:hover {
      background-color: #c82333;
      transform: translateY(-1px);
    }
    
    .btn-warning {
      background-color: #ffc107;
      color: #212529;
    }
    
    .btn-warning:hover {
      background-color: #e0a800;
      transform: translateY(-1px);
    }
    
    .btn-info {
      background-color: #17a2b8;
      color: white;
    }
    
    .btn-info:hover {
      background-color: #138496;
      transform: translateY(-1px);
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #5a6268;
      transform: translateY(-1px);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() titulo: string = 'Confirmar Acción';
  @Input() mensaje: string = '¿Estás seguro de que quieres realizar esta acción?';
  @Input() textoConfirmar: string = 'Confirmar';
  @Input() textoCancelar: string = 'Cancelar';
  @Input() tipo: 'danger' | 'warning' | 'info' = 'danger';
  
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
