import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';
import { GrupoModificador, Modificador } from '../../services/grupo-modificador.service';
import { ProductosService } from '../../services/productos.service';
import { Producto } from '../../types/api.models';

@Component({
  selector: 'app-grupo-modificador-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './grupo-modificador-modal.component.html',
  styleUrls: ['./grupo-modificador-modal.component.css']
})
export class GrupoModificadorModalComponent implements OnInit {
  @Input() grupo: GrupoModificador | null = null;
  @Input() modo: 'crear' | 'editar' = 'crear';
  @Output() guardado = new EventEmitter<GrupoModificador>();
  @Output() cancelado = new EventEmitter<void>();

  constructor(private productosService: ProductosService) { }

  formData: GrupoModificador = {
    id: '',
    nombre: '',
    estado: 'activo',
    modificadores: [],
    cobrarPrecio: false
  };

  // Variables para la búsqueda de modificadores
  terminoBusquedaModificador = '';
  modificadoresDisponibles: Modificador[] = [];
  modificadoresFiltrados: Modificador[] = [];
  modificadorSeleccionado: Modificador | null = null;

  // Variables para la confirmación
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';

  ngOnInit() {
    console.log('ngOnInit llamado, modo:', this.modo);
    if (this.grupo) {
      console.log('Editando grupo existente:', this.grupo);
      this.formData = { ...this.grupo };
    } else {
      console.log('Creando nuevo grupo');
      this.formData = {
        id: '',
        nombre: '',
        estado: 'activo',
        modificadores: [],
        cobrarPrecio: false
      };
    }
    console.log('formData inicial:', this.formData);
    this.cargarModificadoresDisponibles();
  }

  cargarModificadoresDisponibles() {
    this.productosService.getProductosActivos().subscribe({
      next: (productos) => {
        // Convertir productos a modificadores
        this.modificadoresDisponibles = productos.map(producto => ({
          id: Number(producto.id), // Ensure ID is a number for Modificador interface
          nombre: producto.nombre,
          precio: producto.precio,
          estado: producto.activo ? 'activo' : 'inactivo'
        }));
        this.modificadoresFiltrados = [...this.modificadoresDisponibles];
      },
      error: (error) => {
        console.error('Error al cargar productos para modificadores:', error);
        // Fallback a datos vacíos
        this.modificadoresDisponibles = [];
        this.modificadoresFiltrados = [];
      }
    });
  }

  filtrarModificadores() {
    if (!this.terminoBusquedaModificador.trim()) {
      this.modificadoresFiltrados = this.modificadoresDisponibles.filter(mod =>
        !this.formData.modificadores.some(existente => existente.id === mod.id)
      );
    } else {
      this.modificadoresFiltrados = this.modificadoresDisponibles.filter(mod =>
        mod.nombre.toLowerCase().includes(this.terminoBusquedaModificador.toLowerCase()) &&
        !this.formData.modificadores.some(existente => existente.id === mod.id)
      );
    }
    this.modificadorSeleccionado = null;
  }

  seleccionarModificador(modificador: Modificador) {
    this.modificadorSeleccionado = modificador;
  }

  agregarModificadorSeleccionado() {
    console.log('agregarModificadorSeleccionado() llamado');
    console.log('modificadorSeleccionado:', this.modificadorSeleccionado);

    if (this.modificadorSeleccionado) {
      // Verificar que no esté ya agregado
      const yaExiste = this.formData.modificadores.some(mod => mod.id === this.modificadorSeleccionado!.id);
      console.log('yaExiste:', yaExiste);

      if (!yaExiste) {
        this.formData.modificadores.push({ ...this.modificadorSeleccionado });
        console.log('Modificador agregado. Total modificadores:', this.formData.modificadores.length);
        this.modificadorSeleccionado = null;
        this.terminoBusquedaModificador = '';
        this.filtrarModificadores();
      } else {
        console.log('Modificador ya existe, no se agrega');
      }
    } else {
      console.log('No hay modificador seleccionado');
    }
  }

  eliminarModificador(index: number) {
    this.formData.modificadores.splice(index, 1);
    this.filtrarModificadores();
  }

  formatCOP(valor: number | null | undefined): string {
    const numero = typeof valor === 'number' ? valor : Number(valor ?? 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(numero);
  }

  getTituloModal(): string {
    return this.modo === 'crear' ? 'Nuevo Grupo de Modificadores' : 'Editar Grupo de Modificadores';
  }

  getBotonGuardarTexto(): string {
    return this.modo === 'crear' ? 'Crear Grupo' : 'Actualizar Grupo';
  }

  validarFormulario(): boolean {
    const nombreValido = this.formData.nombre.trim() !== '';
    const modificadoresValidos = this.formData.modificadores.length > 0;

    console.log('validarFormulario():', {
      nombre: this.formData.nombre,
      nombreValido,
      modificadores: this.formData.modificadores,
      modificadoresValidos,
      resultado: nombreValido && modificadoresValidos
    });

    return nombreValido && modificadoresValidos;
  }

  confirmarGuardado(): void {
    console.log('confirmarGuardado() llamado');
    console.log('formData:', this.formData);
    console.log('validarFormulario():', this.validarFormulario());

    if (!this.validarFormulario()) {
      console.log('Formulario no válido, retornando');
      return;
    }

    this.tituloConfirmacion = this.modo === 'crear' ? 'Confirmar Creación' : 'Confirmar Actualización';
    this.mensajeConfirmacion = this.modo === 'crear'
      ? `¿Estás seguro de que quieres crear el grupo "${this.formData.nombre}"?`
      : `¿Estás seguro de que quieres actualizar el grupo "${this.formData.nombre}"?`;

    console.log('Mostrando confirmación:', this.tituloConfirmacion, this.mensajeConfirmacion);
    this.mostrarConfirmacion = true;
  }

  procederGuardado(): void {
    this.mostrarConfirmacion = false;
    this.guardado.emit(this.formData);
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
  }

  cerrarModal() {
    this.cancelado.emit();
  }
}
