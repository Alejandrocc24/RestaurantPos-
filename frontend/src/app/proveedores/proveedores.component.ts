import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast/toast.service';
import { ProveedorModalComponent, Proveedor } from './proveedor-modal.component';
import { ProveedoresService } from '../services/proveedores.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, ProveedorModalComponent, ConfirmDialogComponent],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit, OnDestroy {
  @Output() viewChangeRequested = new EventEmitter<string>();


  mostrarModalProveedor: boolean = false;
  proveedorSeleccionado: Proveedor | null = null;
  esEdicionProveedor: boolean = false;
  cargando: boolean = false;

  proveedores: Proveedor[] = [];

  // Control del diálogo de confirmación
  mostrarConfirmDialog: boolean = false;
  confirmDialogConfig: any = {};
  proveedorAEliminar: Proveedor | null = null;

  private modalHistoryManager: ModalHistoryManager;

  constructor(
    private router: Router,
    private toast: ToastService,
    private proveedoresService: ProveedoresService
  ) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'proveedores-base');
  }

  ngOnInit() {
    this.cargarProveedores();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  cargarProveedores() {
    this.cargando = true;
    this.proveedoresService.getProveedores().subscribe({
      next: (proveedores: any) => {
        this.proveedores = proveedores.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          tipo: '', // No existe en la nueva estructura
          estado: p.activo ? 'Activo' : 'Inactivo',
          fechaRegistro: p.created_at ? new Date(p.created_at) : new Date()
        }));
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cargando proveedores:', error);
        this.toast.error('Error', 'No se pudieron cargar los proveedores');
        this.cargando = false;
      }
    });
  }



  navegarAGastos() {
    this.viewChangeRequested.emit('gastos');
  }

  nuevoProveedor() {
    this.proveedorSeleccionado = null;
    this.esEdicionProveedor = false;
    this.modalHistoryManager.registerModalOpen('modal-proveedor', this.mostrarModalProveedor);
    this.mostrarModalProveedor = true;
  }

  editarProveedor(proveedor: Proveedor) {
    this.proveedorSeleccionado = { ...proveedor };
    this.esEdicionProveedor = true;
    this.modalHistoryManager.registerModalOpen('modal-proveedor', this.mostrarModalProveedor);
    this.mostrarModalProveedor = true;
  }

  eliminarProveedor(proveedor: Proveedor) {
    if (!proveedor.id) return;

    this.proveedorAEliminar = proveedor;
    this.confirmDialogConfig = {
      title: '🏢 Eliminar Proveedor',
      message: `¿Está seguro de que desea eliminar el proveedor "${proveedor.nombre}"?`,
      details: 'Esta acción no se puede deshacer. Los gastos asociados a este proveedor mantendrán el nombre del proveedor.',
      type: 'danger',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar'
    };
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-proveedor', this.mostrarConfirmDialog);
    this.mostrarConfirmDialog = true;
  }

  confirmarEliminacion() {
    if (!this.proveedorAEliminar || !this.proveedorAEliminar.id) return;

    this.cargando = true;
    this.proveedoresService.deleteProveedor(String(this.proveedorAEliminar.id)).subscribe({
      next: (response: any) => {
        if (response || response === true) {
          this.toast.success('Proveedor eliminado', `"${this.proveedorAEliminar!.nombre}" eliminado correctamente`);
          this.cargarProveedores();
        }
        this.cargando = false;
        this.cerrarConfirmDialog();
      },
      error: (error: any) => {
        console.error('Error eliminando proveedor:', error);
        this.toast.error('Error', 'No se pudo eliminar el proveedor');
        this.cargando = false;
        this.cerrarConfirmDialog();
      }
    });
  }

  cerrarConfirmDialog(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-proveedor');
    }
    this.mostrarConfirmDialog = false;
    this.proveedorAEliminar = null;
  }

  cambiarEstado(proveedor: Proveedor) {
    if (!proveedor.id) return;

    const nuevoEstado = proveedor.estado === 'Activo' ? false : true;
    this.cargando = true;

    this.proveedoresService.updateProveedor(String(proveedor.id!), { activo: nuevoEstado }).subscribe({
      next: (response: any) => {
        if (response || response === true) {
          proveedor.estado = nuevoEstado ? 'Activo' : 'Inactivo';
          this.toast.info('Estado cambiado', `"${proveedor.nombre}" ahora está ${proveedor.estado}`);
        }
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cambiando estado:', error);
        this.toast.error('Error', 'No se pudo cambiar el estado');
        this.cargando = false;
      }
    });
  }

  guardarProveedor(proveedor: Proveedor) {
    this.cargando = true;

    if (this.esEdicionProveedor && proveedor.id) {
      // Editar proveedor existente
      this.proveedoresService.updateProveedor(String(proveedor.id), {
        nombre: proveedor.nombre,
        activo: proveedor.estado === 'Activo'
      }).subscribe({
        next: (response: any) => {
          if (response || response === true) {
            this.toast.success('Proveedor actualizado', `"${proveedor.nombre}" actualizado correctamente`);
            this.cargarProveedores();
            this.cerrarModalProveedor();
          }
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('Error actualizando proveedor:', error);
          this.toast.error('Error', 'No se pudo actualizar el proveedor');
          this.cargando = false;
        }
      });
    } else {
      // Crear nuevo proveedor
      this.proveedoresService.createProveedor({
        nombre: proveedor.nombre,
        activo: true
      }).subscribe({
        next: (response: any) => {
          if (response || response === true) {
            this.toast.success('Proveedor creado', `"${proveedor.nombre}" creado correctamente`);
            this.cargarProveedores();
            this.cerrarModalProveedor();
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando proveedor:', error);
          this.toast.error('Error', 'No se pudo crear el proveedor');
          this.cargando = false;
        }
      });
    }
  }

  cerrarModalProveedor(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-proveedor');
    }
    this.mostrarModalProveedor = false;
    this.proveedorSeleccionado = null;
    this.esEdicionProveedor = false;
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-proveedor':
        this.cerrarModalProveedor(true);
        break;
      case 'modal-confirmacion-proveedor':
        this.cerrarConfirmDialog(true);
        break;
      default:
        break;
    }
  }


}
