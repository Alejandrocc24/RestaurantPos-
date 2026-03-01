import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast/toast.service';
import { CategoriaGastoModalComponent, CategoriaGasto } from './categoria-gasto-modal.component';
import { GastosService } from '../services/gastos.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';

@Component({
  selector: 'app-categoria-gastos',
  standalone: true,
  imports: [CommonModule, CategoriaGastoModalComponent, ConfirmDialogComponent],
  templateUrl: './categoria-gastos.component.html',
  styleUrls: ['./categoria-gastos.component.css']
})
export class CategoriaGastosComponent implements OnInit, OnDestroy {
  @Output() viewChangeRequested = new EventEmitter<string>();


  mostrarModalCategoria: boolean = false;
  categoriaSeleccionada: CategoriaGasto | null = null;
  esEdicionCategoria: boolean = false;
  cargando: boolean = false;

  categorias: CategoriaGasto[] = [];

  // Control del diálogo de confirmación
  mostrarConfirmDialog: boolean = false;
  confirmDialogConfig: any = {};
  categoriaAEliminar: CategoriaGasto | null = null;

  private modalHistoryManager: ModalHistoryManager;

  constructor(
    private router: Router,
    private toast: ToastService,
    private gastosService: GastosService
  ) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'categoria-gastos-base');
  }

  ngOnInit() {
    this.cargarCategorias();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  cargarCategorias() {
    this.cargando = true;
    this.gastosService.getCategoriasGastos().subscribe({
      next: (categorias) => {
        this.categorias = categorias.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          estado: c.activo ? 'Activo' : 'Inactivo',
          fechaCreacion: c.created_at ? new Date(c.created_at) : new Date()
        }));
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.toast.error('Error', 'No se pudieron cargar las categorías');
        this.cargando = false;
      }
    });
  }



  navegarAGastos() {
    this.viewChangeRequested.emit('gastos');
  }

  nuevaCategoria() {
    this.categoriaSeleccionada = null;
    this.esEdicionCategoria = false;
    this.modalHistoryManager.registerModalOpen('modal-categoria-gasto', this.mostrarModalCategoria);
    this.mostrarModalCategoria = true;
  }

  editarCategoria(categoria: CategoriaGasto) {
    this.categoriaSeleccionada = { ...categoria };
    this.esEdicionCategoria = true;
    this.modalHistoryManager.registerModalOpen('modal-categoria-gasto', this.mostrarModalCategoria);
    this.mostrarModalCategoria = true;
  }

  eliminarCategoria(categoria: CategoriaGasto) {
    if (!categoria.id) return;

    this.categoriaAEliminar = categoria;
    this.confirmDialogConfig = {
      title: '📂 Eliminar Categoría de Gasto',
      message: `¿Está seguro de que desea eliminar la categoría "${categoria.nombre}"?`,
      details: 'Esta acción no se puede deshacer. Los gastos asociados a esta categoría mantendrán el nombre de la categoría.',
      type: 'danger',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    };
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-categoria-gasto', this.mostrarConfirmDialog);
    this.mostrarConfirmDialog = true;
  }

  confirmarEliminacion() {
    if (!this.categoriaAEliminar || !this.categoriaAEliminar.id) return;

    this.cargando = true;
    this.gastosService.deleteCategoriaGasto(this.categoriaAEliminar.id).subscribe({
      next: (response) => {
        if (response) {
          this.toast.success('Categoría eliminada', `"${this.categoriaAEliminar!.nombre}" eliminada correctamente`);
          this.cargarCategorias();
        }
        this.cargando = false;
        this.cerrarConfirmDialog();
      },
      error: (error) => {
        console.error('Error eliminando categoría:', error);
        this.toast.error('Error', 'No se pudo eliminar la categoría');
        this.cargando = false;
        this.cerrarConfirmDialog();
      }
    });
  }

  cerrarConfirmDialog(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-categoria-gasto');
    }
    this.mostrarConfirmDialog = false;
    this.categoriaAEliminar = null;
  }

  cambiarEstado(categoria: CategoriaGasto) {
    if (!categoria.id) return;

    const nuevoEstado = categoria.estado === 'Activo' ? false : true;
    this.cargando = true;

    this.gastosService.updateCategoriaGasto(categoria.id, { activo: nuevoEstado }).subscribe({
      next: (response) => {
        if (response) {
          categoria.estado = nuevoEstado ? 'Activo' : 'Inactivo';
          this.toast.info('Estado cambiado', `"${categoria.nombre}" ahora está ${categoria.estado}`);
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cambiando estado:', error);
        this.toast.error('Error', 'No se pudo cambiar el estado');
        this.cargando = false;
      }
    });
  }

  guardarCategoria(categoria: CategoriaGasto) {
    // Validar nombre antes de hacer nada
    const nombre = categoria?.nombre?.trim();
    if (!nombre) {
      this.toast.error('❌ Validación', 'El nombre es obligatorio');
      return;
    }

    if (nombre.length < 3) {
      this.toast.error('❌ Validación', 'El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (nombre.length > 100) {
      this.toast.error('❌ Validación', 'El nombre no puede exceder 100 caracteres');
      return;
    }

    // Solo si pasa validación, proceder
    this.cargando = true;

    if (this.esEdicionCategoria && categoria.id) {
      // Editar categoría existente
      this.gastosService.updateCategoriaGasto(categoria.id, {
        nombre: categoria.nombre,
        activo: categoria.estado === 'Activo'
      }).subscribe({
        next: (response) => {
          if (response) {
            this.toast.success('✅ Categoría actualizada', `"${categoria.nombre}" actualizada correctamente`);
            this.cargarCategorias();
          }
          this.cerrarModalCategoria();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error actualizando categoría:', error);
          this.toast.error('❌ Error', 'No se pudo actualizar la categoría');
          this.cargando = false;
        }
      });
    } else {
      // Crear nueva categoría
      this.gastosService.createCategoriaGasto({
        nombre: categoria.nombre,
        activo: true
      }).subscribe({
        next: (response) => {
          if (response) {
            this.toast.success('✅ Categoría creada', `"${categoria.nombre}" creada correctamente`);
            this.cargarCategorias();
            this.cerrarModalCategoria();
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando categoría:', error);
          this.toast.error('❌ Error', 'No se pudo crear la categoría');
          this.cargando = false;
        }
      });
    }
  }

  cerrarModalCategoria(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-categoria-gasto');
    }
    this.mostrarModalCategoria = false;
    this.categoriaSeleccionada = null;
    this.esEdicionCategoria = false;
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-categoria-gasto':
        this.cerrarModalCategoria(true);
        break;
      case 'modal-confirmacion-categoria-gasto':
        this.cerrarConfirmDialog(true);
        break;
      default:
        break;
    }
  }

  // Métodos para calcular estadísticas
  getTotalCategorias(): number {
    return this.categorias.length;
  }

  getCategoriasActivas(): number {
    return this.categorias.filter(c => c.estado === 'Activo').length;
  }

  getCategoriasInactivas(): number {
    return this.categorias.filter(c => c.estado === 'Inactivo').length;
  }
}
