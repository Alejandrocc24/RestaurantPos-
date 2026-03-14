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

  // Getter para calcular modificadores filtrados en tiempo real
  get modificadoresFiltrados(): Modificador[] {
    // Filtrar por nombre (no por ID) porque los IDs de opciones != IDs de productos
    const nombresAgregados = this.formData.modificadores.map(m => m.nombre.toLowerCase());
    const filtrados = this.modificadoresDisponibles.filter(mod =>
      !nombresAgregados.includes(mod.nombre.toLowerCase())
    );
    
    if (!this.terminoBusquedaModificador.trim()) {
      return filtrados;
    }
    return filtrados.filter(mod =>
      mod.nombre.toLowerCase().includes(this.terminoBusquedaModificador.toLowerCase())
    );
  }

  // Variables para la confirmación
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';

  ngOnInit() {
    console.log('ngOnInit llamado, modo:', this.modo);
    if (this.grupo) {
      console.log('Editando grupo existente:', this.grupo);
      this.formData = { 
        ...this.grupo,
        modificadores: (this.grupo.modificadores || []).map(m => ({
          ...m,
          id: typeof m.id === 'string' && !isNaN(Number(m.id)) ? Number(m.id) : m.id
        }))
      };
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
        const list: Modificador[] = productos.map(producto => ({
          id: typeof producto.id === 'string' && !isNaN(Number(producto.id)) ? Number(producto.id) : producto.id,
          productoId: String(producto.id),
          nombre: producto.nombre,
          precio: producto.precio,
          estado: (producto.activo ? 'activo' : 'inactivo') as 'activo' | 'inactivo'
        }));
        // Eliminar duplicados por id (normalizados a String para comparar)
        const seen = new Set<string>();
        this.modificadoresDisponibles = list.filter(m => {
          const key = String(m.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        console.log('modificadoresDisponibles cargados:', this.modificadoresDisponibles.length);
      },
      error: (error) => {
        console.error('Error al cargar productos para modificadores:', error);
        // Fallback a datos vacíos
        this.modificadoresDisponibles = [];
      }
    });
  }

  seleccionarModificador(modificador: Modificador) {
    console.log('seleccionarModificador() llamado para:', modificador.nombre);
    
    // Verificar si ya existe por nombre (no por ID)
    const yaExiste = this.formData.modificadores.some(mod =>
      mod.nombre.toLowerCase() === modificador.nombre.toLowerCase()
    );
    
    if (yaExiste) {
      console.log('Modificador ya agregado, ignorando:', modificador.nombre);
      return;
    }
    
    // Agregar
    this.formData.modificadores = [...this.formData.modificadores, { ...modificador }];
    this.terminoBusquedaModificador = '';
    console.log('Agregado. Total:', this.formData.modificadores.length);
  }

  estaModificadorAgregado(modificadorId: number): boolean {
    return this.formData.modificadores.some(mod => String(mod.id) === String(modificadorId));
  }

  trackByModificadorId(_index: number, mod: Modificador): number {
    return Number(mod.id);
  }

  trackByModificadorIndex(index: number, _mod: Modificador): number {
    return index;
  }

  eliminarModificador(index: number) {
    // Usar asignación para forzar detección de cambios
    this.formData.modificadores = this.formData.modificadores.filter((_, i) => i !== index);
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
