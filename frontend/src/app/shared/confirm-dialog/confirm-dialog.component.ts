import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" (click)="onCancel()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-header" [class.warning]="type === 'warning'" [class.danger]="type === 'danger'">
          <i class="fas" [class.fa-exclamation-triangle]="type === 'warning'" 
             [class.fa-trash-alt]="type === 'danger'"
             [class.fa-question-circle]="type === 'info'"></i>
          <h3>{{ title }}</h3>
        </div>
        
        <div class="confirm-body">
          <p>{{ message }}</p>
          <p *ngIf="details" class="details">{{ details }}</p>
        </div>
        
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            {{ cancelText }}
          </button>
          <button type="button" 
                  class="btn" 
                  [class.btn-warning]="type === 'warning'"
                  [class.btn-danger]="type === 'danger'"
                  [class.btn-primary]="type === 'info'"
                  (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }

    .confirm-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 450px;
      width: 90%;
      animation: slideUp 0.3s ease;
    }

    .confirm-header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f9fafb;
      border-radius: 12px 12px 0 0;
    }

    .confirm-header.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .confirm-header.danger {
      background: #fee2e2;
      color: #991b1b;
    }

    .confirm-header i {
      font-size: 24px;
    }

    .confirm-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .confirm-body {
      padding: 24px;
    }

    .confirm-body p {
      margin: 0 0 12px 0;
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
    }

    .confirm-body p:last-child {
      margin-bottom: 0;
    }

    .details {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
    }

    .confirm-actions {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() title: string = 'Confirmar acción';
  @Input() message: string = '¿Está seguro de que desea continuar?';
  @Input() details?: string;
  @Input() type: 'info' | 'warning' | 'danger' = 'warning';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
