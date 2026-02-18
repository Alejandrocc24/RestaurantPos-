import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Proveedor {
  id?: number;
  nombre: string;
  tipo: string;
  estado: string;
  fechaRegistro?: Date;
}

@Component({
  selector: 'app-proveedor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor-modal.component.html',
  styleUrls: ['./proveedor-modal.component.css']
})
export class ProveedorModalComponent implements OnInit {
  @Input() proveedor: Proveedor | null = null;
  @Input() esEdicion: boolean = false;
  @Output() guardar = new EventEmitter<Proveedor>();
  @Output() cerrar = new EventEmitter<void>();

  proveedorForm: Proveedor = {
    nombre: '',
    tipo: '',
    estado: 'Activo'
  };

  tipos: string[] = [
    'Insumos',
    'Equipos',
    'Servicios',
    'Marketing',
    'Otros'
  ];

  estados: string[] = [
    'Activo',
    'Inactivo'
  ];

  ngOnInit() {
    if (this.proveedor && this.esEdicion) {
      this.proveedorForm = { ...this.proveedor };
    }
  }

  onSubmit() {
    if (this.esEdicion && this.proveedor?.id) {
      this.proveedorForm.id = this.proveedor.id;
    }
    this.guardar.emit(this.proveedorForm);
  }

  onCerrar() {
    this.cerrar.emit();
  }
}
