import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrupoModificadorService, GrupoModificador, Modificador } from '../../services/grupo-modificador.service';
import { ToastService } from '../../shared/toast/toast.service';
import { GrupoModificadorModalComponent } from './grupo-modificador-modal.component';
import { ConfirmModalComponent } from '../../shared/confirm-modal';
import { ModalHistoryManager } from '../../shared/utils/modal-history-manager';

@Component({
  selector: 'app-grupos-modificadores',
  standalone: true,
  templateUrl: './grupos-modificadores.component.html',
  styleUrls: ['./grupos-modificadores.component.css'],
  imports: [CommonModule, FormsModule, GrupoModificadorModalComponent, ConfirmModalComponent]
})
export class GruposModificadoresComponent implements OnInit, OnDestroy {
  grupos: GrupoModificador[] = [];
  gruposFiltrados: GrupoModificador[] = [];
  mostrarInactivos = false;

  private readonly estadoMostrarInactivosKey = 'grupos-modificadores-mostrarInactivos';

  // Variables para el modal
  mostrarModalGrupo = false;
  grupoSeleccionado: GrupoModificador | null = null;
  esEdicionGrupo = false;

  // Variables para el modal de confirmación
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  accionConfirmacion: 'cambiarEstado' | 'cambiarCobrarPrecio' | 'eliminar' | null = null;
  grupoParaAccion: GrupoModificador | null = null;

  @Output() viewChangeRequested = new EventEmitter<string>();
  @Output() onVolver = new EventEmitter<void>();

  private modalHistoryManager: ModalHistoryManager;

  constructor(private grupoModificadorService: GrupoModificadorService, private toast: ToastService) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'grupos-modificadores-base');
  }

  ngOnInit(): void {
    this.cargarEstadoMostrarInactivos();
    this.cargarGruposModificadores();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  cargarGruposModificadores(): void {
    this.grupoModificadorService.getGruposModificadores().subscribe({
      next: (grupos) => {
        this.grupos = grupos;
        this.filtrarGrupos();
      },
      error: (error) => {
        console.error('Error al cargar grupos modificadores:', error);
        this.toast.error('Error', 'No se pudieron cargar los grupos modificadores');
      }
    });
  }

  nuevoGrupo(): void {
    this.grupoSeleccionado = null;
    this.esEdicionGrupo = false;
    this.modalHistoryManager.registerModalOpen('modal-grupo-modificador', this.mostrarModalGrupo);
    this.mostrarModalGrupo = true;
  }

  editarGrupo(grupo: GrupoModificador): void {
    this.grupoSeleccionado = { ...grupo };
    this.esEdicionGrupo = true;
    this.modalHistoryManager.registerModalOpen('modal-grupo-modificador', this.mostrarModalGrupo);
    this.mostrarModalGrupo = true;
  }

  eliminarGrupo(grupo: GrupoModificador): void {
    this.tituloConfirmacion = 'Confirmar Eliminación';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres eliminar el grupo "${grupo.nombre}"?\n\nEsta acción no se puede deshacer.`;
    this.accionConfirmacion = 'eliminar';
    this.grupoParaAccion = grupo;
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-grupos', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  cambiarEstado(grupo: GrupoModificador): void {
    const nuevoEstado = grupo.estado === 'activo' ? 'inactivo' : 'activo';

    this.tituloConfirmacion = 'Confirmar Cambio de Estado';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres cambiar el estado de "${grupo.nombre}" a ${nuevoEstado}?`;
    this.accionConfirmacion = 'cambiarEstado';
    this.grupoParaAccion = grupo;
    this.mostrarConfirmacion = true;
  }

  cambiarCobrarPrecio(grupo: GrupoModificador): void {
    const nuevoValor = !grupo.cobrarPrecio;

    this.tituloConfirmacion = 'Confirmar Cambio de Cobro';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres cambiar el cobro de precio de "${grupo.nombre}" a ${nuevoValor ? 'Sí' : 'No'}?`;
    this.accionConfirmacion = 'cambiarCobrarPrecio';
    this.grupoParaAccion = grupo;
    this.mostrarConfirmacion = true;
  }

  onGrupoGuardado(grupo: GrupoModificador): void {
    if (this.esEdicionGrupo) {
      // Actualizar grupo existente
      this.grupoModificadorService.actualizarGrupoModificador(grupo.id, grupo).subscribe({
        next: (grupoActualizado) => {
          const index = this.grupos.findIndex(g => g.id === grupo.id);
          if (index !== -1) {
            this.grupos[index] = grupoActualizado;
          }
          this.filtrarGrupos();
          this.toast.success('Grupo actualizado', `"${grupo.nombre}" actualizado correctamente`);
          this.cerrarModalGrupo();
        },
        error: (error) => {
          console.error('Error al actualizar grupo:', error);
          this.toast.error('Error', 'No se pudo actualizar el grupo modificador');
        }
      });
    } else {
      // Crear nuevo grupo
      this.grupoModificadorService.crearGrupoModificador(grupo).subscribe({
        next: (nuevoGrupo) => {
          this.grupos.push(nuevoGrupo);
          this.filtrarGrupos();
          this.toast.success('Grupo creado', `"${nuevoGrupo.nombre}" creado correctamente`);
          this.mostrarModalGrupo = false;
          this.grupoSeleccionado = null;
        },
        error: (error) => {
          console.error('Error al crear grupo:', error);
          this.toast.error('Error', 'No se pudo crear el grupo modificador');
        }
      });
    }
  }

  onModalCerrado(): void {
    this.cerrarModalGrupo();
  }

  navegarAProductos(): void {
    if (this.onVolver.observers.length > 0) {
      this.onVolver.emit();
    } else {
      this.viewChangeRequested.emit('productos');
    }
  }

  navegarACategoriaProductos(): void {
    this.viewChangeRequested.emit('categoria-productos');
  }

  navegarAGestionComentarios(): void {
    this.viewChangeRequested.emit('gestion-comentarios');
  }

  procederCambioEstado(): void {
    if (!this.grupoParaAccion) return;

    const grupo = this.grupoParaAccion;
    const nuevoEstado = grupo.estado === 'activo' ? 'inactivo' : 'activo';

    this.grupoModificadorService.cambiarEstado(grupo.id, nuevoEstado).subscribe({
      next: (grupoActualizado) => {
        const index = this.grupos.findIndex(g => g.id === grupo.id);
        if (index !== -1) {
          this.grupos[index] = grupoActualizado;
        }
        this.toast.info('Estado cambiado', `"${grupo.nombre}" ahora está ${nuevoEstado}`);
        this.filtrarGrupos();
        this.cerrarConfirmacion();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.toast.error('Error', 'No se pudo cambiar el estado del grupo');
        this.cerrarConfirmacion();
      }
    });
  }

  cerrarModalGrupo(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-grupo-modificador');
    }
    this.mostrarModalGrupo = false;
    this.grupoSeleccionado = null;
    this.esEdicionGrupo = false;
  }

  procederCambioCobrarPrecio(): void {
    if (!this.grupoParaAccion) return;

    const grupo = this.grupoParaAccion;
    const nuevoValor = !grupo.cobrarPrecio;

    // Actualizar el valor en el backend
    this.grupoModificadorService.actualizarGrupoModificador(grupo.id, { ...grupo, cobrarPrecio: nuevoValor }).subscribe({
      next: (grupoActualizado) => {
        const index = this.grupos.findIndex(g => g.id === grupo.id);
        if (index !== -1) {
          this.grupos[index] = grupoActualizado;
        }
        this.toast.info('Cobro de precio', `"${grupo.nombre}": cobro ${nuevoValor ? 'activado' : 'desactivado'}`);
        this.filtrarGrupos();
        this.cerrarConfirmacion();
      },
      error: (error) => {
        console.error('Error al cambiar cobro de precio:', error);
        this.toast.error('Error', 'No se pudo cambiar el cobro de precio');
        this.cerrarConfirmacion();
      }
    });
  }

  procederEliminacion(): void {
    if (!this.grupoParaAccion) return;

    const grupo = this.grupoParaAccion;

    this.grupoModificadorService.eliminarGrupoModificador(grupo.id).subscribe({
      next: () => {
        this.grupos = this.grupos.filter(g => g.id !== grupo.id);
        this.filtrarGrupos();
        this.toast.success('Grupo eliminado', `"${grupo.nombre}" eliminado correctamente`);
        this.cerrarConfirmacion();
      },
      error: (error) => {
        console.error('Error al eliminar grupo:', error);
        this.toast.error('Error', 'No se pudo eliminar el grupo modificador');
        this.cerrarConfirmacion();
      }
    });
  }

  cerrarConfirmacion(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-grupos');
    }
    this.mostrarConfirmacion = false;
    this.tituloConfirmacion = '';
    this.mensajeConfirmacion = '';
    this.accionConfirmacion = null;
    this.grupoParaAccion = null;
  }

  procederAccion(): void {
    if (this.accionConfirmacion === 'cambiarEstado') {
      this.procederCambioEstado();
    } else if (this.accionConfirmacion === 'cambiarCobrarPrecio') {
      this.procederCambioCobrarPrecio();
    } else if (this.accionConfirmacion === 'eliminar') {
      this.procederEliminacion();
    }
  }

  filtrarGrupos(): void {
    if (this.mostrarInactivos) {
      this.gruposFiltrados = [...this.grupos];
    } else {
      this.gruposFiltrados = this.grupos.filter(g => g.estado === 'activo');
    }
  }

  toggleMostrarInactivos(): void {
    this.mostrarInactivos = !this.mostrarInactivos;
    this.guardarEstadoMostrarInactivos();
    this.filtrarGrupos();
  }

  private cargarEstadoMostrarInactivos(): void {
    try {
      const estadoGuardado = localStorage.getItem(this.estadoMostrarInactivosKey);
      if (estadoGuardado !== null) {
        this.mostrarInactivos = JSON.parse(estadoGuardado);
      }
    } catch (error: unknown) {
      console.warn('Error cargando estado mostrarInactivos (grupos modificadores):', error);
      this.mostrarInactivos = false;
    }
  }

  private guardarEstadoMostrarInactivos(): void {
    try {
      localStorage.setItem(this.estadoMostrarInactivosKey, JSON.stringify(this.mostrarInactivos));
    } catch (error: unknown) {
      console.warn('Error guardando estado mostrarInactivos (grupos modificadores):', error);
    }
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-grupo-modificador':
        this.cerrarModalGrupo(true);
        break;
      case 'modal-confirmacion-grupos':
        this.cerrarConfirmacion(true);
        break;
      default:
        break;
    }
  }
}
