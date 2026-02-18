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



  ngOnInit() {
    if (this.categoria && this.esEdicion) {
      this.categoriaForm = { ...this.categoria };
    }
  }

  onSubmit() {
    if (this.esEdicion && this.categoria?.id) {
      this.categoriaForm.id = this.categoria.id;
    }
    this.guardar.emit(this.categoriaForm);
  }

  onCerrar() {
    this.cerrar.emit();
  }


}
