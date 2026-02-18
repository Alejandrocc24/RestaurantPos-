import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NuevoProveedorData {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}

@Component({
  selector: 'app-nuevo-proveedor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onCerrar()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>🏢 Agregar Nuevo Proveedor</h2>
          <button class="close-btn" (click)="onCerrar()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="modal-form">
          <div class="form-group">
            <label for="nombre">Nombre del Proveedor *</label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre"
              [(ngModel)]="proveedorForm.nombre"
              required
              placeholder="Ej: Distribuidora XYZ"
              autofocus>
          </div>

          <div class="form-group">
            <label for="contacto">Persona de Contacto</label>
            <input 
              type="text" 
              id="contacto" 
              name="contacto"
              [(ngModel)]="proveedorForm.contacto"
              placeholder="Ej: Juan Pérez">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input 
                type="tel" 
                id="telefono" 
                name="telefono"
                [(ngModel)]="proveedorForm.telefono"
                placeholder="Ej: 555-1234">
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                [(ngModel)]="proveedorForm.email"
                placeholder="Ej: contacto@proveedor.com">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="onCerrar()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!proveedorForm.nombre">
              <i class="fas fa-plus"></i> Agregar Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .modal-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }

    .form-group input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NuevoProveedorModalComponent {
  @Output() guardar = new EventEmitter<NuevoProveedorData>();
  @Output() cerrar = new EventEmitter<void>();

  proveedorForm: NuevoProveedorData = {
    nombre: '',
    contacto: '',
    telefono: '',
    email: ''
  };

  onSubmit() {
    if (this.proveedorForm.nombre.trim()) {
      this.guardar.emit(this.proveedorForm);
    }
  }

  onCerrar() {
    this.cerrar.emit();
  }
}
