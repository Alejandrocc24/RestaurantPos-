import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CategoriaGasto {
  id?: number;
  nombre: string;
  estado: string;
  fechaCreacion?: Date;
}

@Component({
  selector: 'app-categoria-gasto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-gasto-modal.component.html',
  styleUrls: ['./categoria-gasto-modal.component.css']
})
export class CategoriaGastoModalComponent implements OnInit {
  @Input() categoria: CategoriaGasto | null = null;
  @Input() esEdicion: boolean = false;
  @Output() guardar = new EventEmitter<CategoriaGasto>();
  @Output() cerrar = new EventEmitter<void>();

  categoriaForm: CategoriaGasto = {
    nombre: '',
    estado: 'Activo'
  };

  estados: string[] = [
    'Activo',
    'Inactivo'
  ];

  errores: Record<string, string> = {};



  ngOnInit() {
    if (this.categoria && this.esEdicion) {
      this.categoriaForm = { ...this.categoria };
    }
  }

  validarNombre(): void {
    const nombre = this.categoriaForm.nombre?.trim();
    delete this.errores['nombre'];

    if (!nombre) {
      return;
    }

    if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (nombre.length > 100) {
      this.errores['nombre'] = 'El nombre no puede exceder 100 caracteres';
      return;
    }
  }

  onSubmit() {
    // Limpiar errores previos
    this.errores = {};

    // Validar nombre
    const nombre = this.categoriaForm.nombre?.trim();
    if (!nombre) {
      this.errores['nombre'] = 'El nombre es obligatorio';
    } else if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
    } else if (nombre.length > 100) {
      this.errores['nombre'] = 'El nombre no puede exceder 100 caracteres';
    }

    // Si hay errores, no continuar
    if (Object.keys(this.errores).length > 0) {
      return;
    }

    if (this.esEdicion && this.categoria?.id) {
      this.categoriaForm.id = this.categoria.id;
    }
    this.guardar.emit(this.categoriaForm);
  }

  onCerrar() {
    this.cerrar.emit();
  }


}
