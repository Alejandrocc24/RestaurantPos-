import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast/toast.service';
import { GastoModalComponent } from './gasto-modal.component';
import { Gasto } from '../types/api.models';
import { GastosService } from '../services/gastos.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { CurrencyFormatPipe } from '../shared/pipes/currency-format.pipe';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, GastoModalComponent, ConfirmDialogComponent, CurrencyFormatPipe],
  templateUrl: './gastos.component.html',
  styleUrls: ['./gastos.component.css']
})
export class GastosComponent implements OnInit, OnDestroy {
  @Output() viewChangeRequested = new EventEmitter<string>();

  sidebarVisible: boolean = false;
  isMobile: boolean = false;
  categoriaSeleccionada: string = 'Todas';
  mostrarModalGasto: boolean = false;
  gastoSeleccionado: Gasto | null = null;
  esEdicionGasto: boolean = false;
  tabActivo: string = 'gastos';
  sidebarInitialized: boolean = false;
  cargando: boolean = false;

  gastos: Gasto[] = [];
  gastosFiltrados: Gasto[] = [];
  categoriasGastos: string[] = ['Todas'];

  // Control del diálogo de confirmación
  mostrarConfirmDialog: boolean = false;
  confirmDialogConfig: any = {};
  gastoAEliminar: Gasto | null = null;

  private modalHistoryManager: ModalHistoryManager;
  private resizeHandler = () => this.checkMobile();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private toast: ToastService,
    private gastosService: GastosService
  ) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'gastos-base');
  }

  ngOnInit() {
    this.checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }

    // Habilitar transiciones del sidebar después de un breve delay
    setTimeout(() => {
      this.sidebarInitialized = true;
    }, 100);

    // Cargar datos desde la base de datos
    this.cargarGastos();
    this.cargarCategorias();
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.modalHistoryManager.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
    // No forzamos el cierre del sidebar aquí, respetamos el estado inicial
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  navegarAProveedores() {
    this.viewChangeRequested.emit('proveedores');
    this.tabActivo = 'proveedores';
  }

  cambiarTab(tab: string) {
    this.tabActivo = tab;
  }

  navegarACategoriaGastos() {
    this.viewChangeRequested.emit('categoria-gastos');
    this.tabActivo = 'categoria';
  }

  nuevoGasto() {
    this.gastoSeleccionado = null;
    this.esEdicionGasto = false;
    this.modalHistoryManager.registerModalOpen('modal-gasto', this.mostrarModalGasto);
    this.mostrarModalGasto = true;
  }

  editarGasto(gasto: Gasto) {
    this.gastoSeleccionado = { ...gasto };
    this.esEdicionGasto = true;
    this.modalHistoryManager.registerModalOpen('modal-gasto', this.mostrarModalGasto);
    this.mostrarModalGasto = true;
  }

  eliminarGasto(gasto: Gasto) {
    if (!gasto.id) return;

    const currencyPipe = new CurrencyFormatPipe();
    this.gastoAEliminar = gasto;
    this.confirmDialogConfig = {
      title: '🗑️ Eliminar Gasto',
      message: `¿Está seguro de que desea eliminar el gasto "${gasto.descripcion}"?`,
      details: `Monto: ${currencyPipe.transform(gasto.monto)} | Categoría: ${gasto.categoria} | Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    };
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-gasto', this.mostrarConfirmDialog);
    this.mostrarConfirmDialog = true;
  }

  confirmarEliminacion() {
    if (!this.gastoAEliminar || !this.gastoAEliminar.id) return;

    this.cargando = true;
    this.gastosService.deleteGasto(this.gastoAEliminar.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eliminado) => {
          if (eliminado) {
            this.toast.success('Gasto eliminado', `"${this.gastoAEliminar!.descripcion}" eliminado correctamente`);
            this.cargarGastos();
          }
          this.cargando = false;
          this.cerrarConfirmDialog();
        },
        error: (error) => {
          console.error('Error eliminando gasto:', error);
          this.toast.error('Error', 'No se pudo eliminar el gasto');
          this.cargando = false;
          this.cerrarConfirmDialog();
        }
      });
  }

  cerrarConfirmDialog(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-gasto');
    }
    this.mostrarConfirmDialog = false;
    this.gastoAEliminar = null;
  }

  cargarGastos() {
    this.cargando = true;
    this.gastosService.getGastos(0, 500)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gastos) => {
          this.gastos = gastos;
          this.filtrarPorCategoria(this.categoriaSeleccionada);
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error cargando gastos:', error);
          this.toast.error('Error', 'No se pudieron cargar los gastos');
          this.cargando = false;
        }
      });
  }

  cargarCategorias() {
    this.gastosService.getCategoriasGastos(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categorias) => {
          const nombresCategorias = categorias
            .filter(c => c.activo !== false)
            .map(c => c.nombre);
          this.categoriasGastos = ['Todas', ...nombresCategorias];
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
        }
      });
  }

  guardarGasto(gasto: Gasto) {
    this.cargando = true;

    if (this.esEdicionGasto && gasto.id) {
      // Editar gasto existente
      this.gastosService.updateGasto(gasto.id, gasto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (gastoActualizado) => {
            if (gastoActualizado) {
              this.toast.success('Gasto actualizado', 'El gasto fue actualizado correctamente');
              this.cargarGastos();
              this.cerrarModalGasto();
            }
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error actualizando gasto:', error);
            this.toast.error('Error', 'No se pudo actualizar el gasto');
            this.cargando = false;
          }
        });
    } else {
      // Crear nuevo gasto
      this.gastosService.createGasto(gasto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (gastoCreado) => {
            if (gastoCreado) {
              this.toast.success('Gasto creado', 'El gasto fue creado correctamente');
              this.cargarGastos();
              this.cerrarModalGasto();
            }
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error creando gasto:', error);
            this.toast.error('Error', 'No se pudo crear el gasto');
            this.cargando = false;
          }
        });
    }
  }

  cerrarModalGasto(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-gasto');
    }
    this.mostrarModalGasto = false;
    this.gastoSeleccionado = null;
    this.esEdicionGasto = false;
  }

  filtrarPorCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    if (categoria === 'Todas') {
      this.gastosFiltrados = [...this.gastos];
    } else {
      this.gastosFiltrados = this.gastos.filter(gasto => gasto.categoria === categoria);
    }
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-gasto':
        this.cerrarModalGasto(true);
        break;
      case 'modal-confirmacion-gasto':
        this.cerrarConfirmDialog(true);
        break;
      default:
        break;
    }
  }
}
