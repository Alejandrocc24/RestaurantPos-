import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../../shared/confirm-modal';
import { ToastService } from '../../shared/toast/toast.service';
import { SupabaseService } from '../../services/supabase.service';
import { ModalHistoryManager } from '../../shared/utils/modal-history-manager';

@Component({
  selector: 'app-gestion-comentarios',
  standalone: true,
  templateUrl: './gestion-comentarios.component.html',
  styleUrls: ['./gestion-comentarios.component.css'],
  imports: [CommonModule, FormsModule, ConfirmModalComponent]
})
export class GestionComentariosComponent implements OnInit, OnDestroy {
  comentarios: any[] = [];
  comentariosFiltrados: any[] = [];
  mostrarModalNuevoComentario = false;
  comentarioEditando: any = null;
  esEdicionComentario = false;
  nuevoComentario = {
    texto: '',
    activo: true
  };
  mostrarInactivos = false;

  private readonly estadoMostrarInactivosKey = 'gestion-comentarios-mostrarInactivos';

  // Variables para el modal de confirmación
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  accionConfirmacion: 'cambiarEstado' | 'eliminar' | null = null;
  comentarioParaAccion: any = null;

  @Output() viewChangeRequested = new EventEmitter<string>();

  private modalHistoryManager: ModalHistoryManager;

  constructor(private toast: ToastService, private supabase: SupabaseService) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'gestion-comentarios-base');
  }

  ngOnInit(): void {
    this.cargarEstadoMostrarInactivos();
    this.cargarComentarios();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  async cargarComentarios(): Promise<void> {
    try {
      const data = await this.supabase.getComentariosPreestablecidos({ incluirInactivos: true });
      // Asegurar orden por id asc
      this.comentarios = (data || []).sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
      this.filtrarComentarios();
    } catch (e) {
      console.error('Error cargando comentarios:', e);
      this.toast.error('Error', 'No se pudieron cargar los comentarios');
      this.comentarios = [];
      this.filtrarComentarios();
    }
  }

  abrirModalNuevoComentario(): void {
    this.nuevoComentario = {
      texto: '',
      activo: true
    };
    this.comentarioEditando = null;
    this.esEdicionComentario = false;
    this.modalHistoryManager.registerModalOpen('modal-comentario', this.mostrarModalNuevoComentario);
    this.mostrarModalNuevoComentario = true;
  }

  cerrarModalNuevoComentario(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-comentario');
    }
    this.mostrarModalNuevoComentario = false;
    this.comentarioEditando = null;
    this.esEdicionComentario = false;
  }

  async guardarComentario(): Promise<void> {
    const texto = (this.nuevoComentario.texto || '').trim();
    if (!texto) return;
    try {
      if (this.esEdicionComentario && this.comentarioEditando) {
        const actualizado = await this.supabase.actualizarComentarioPreestablecido(this.comentarioEditando.id, {
          texto,
          activo: !!this.nuevoComentario.activo
        });
        const idx = this.comentarios.findIndex(c => c.id === this.comentarioEditando.id);
        if (idx !== -1) this.comentarios[idx] = actualizado;
        this.ordenarComentarios();
        this.filtrarComentarios();
        this.toast.success('Comentario actualizado', 'El comentario fue actualizado correctamente');
      } else {
        const creado = await this.supabase.crearComentarioPreestablecido({
          texto,
          activo: !!this.nuevoComentario.activo
        });
        this.comentarios.push(creado);
        this.ordenarComentarios();
        this.filtrarComentarios();
        this.toast.success('Comentario creado', 'El comentario fue creado correctamente');
      }
      this.cerrarModalNuevoComentario();
    } catch (e) {
      console.error('Error guardando comentario:', e);
      this.toast.error('Error', 'No se pudo guardar el comentario');
    }
  }

  editarComentario(comentario: any): void {
    this.comentarioEditando = { ...comentario };
    this.nuevoComentario = {
      texto: comentario.texto,
      activo: comentario.activo
    };
    this.esEdicionComentario = true;
    this.modalHistoryManager.registerModalOpen('modal-comentario', this.mostrarModalNuevoComentario);
    this.mostrarModalNuevoComentario = true;
  }

  eliminarComentario(comentario: any): void {
    this.tituloConfirmacion = 'Confirmar Eliminación';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres eliminar el comentario "${comentario.texto}"?\n\nEsta acción no se puede deshacer.`;
    this.accionConfirmacion = 'eliminar';
    this.comentarioParaAccion = comentario;
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-comentario', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  cambiarEstadoComentario(comentario: any): void {
    const nuevoEstado = !comentario.activo;
    
    this.tituloConfirmacion = 'Confirmar Cambio de Estado';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres cambiar el estado del comentario "${comentario.texto}" a ${nuevoEstado ? 'Activo' : 'Inactivo'}?`;
    this.accionConfirmacion = 'cambiarEstado';
    this.comentarioParaAccion = comentario;
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-comentario', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  // Métodos de navegación
  navegarAProductos(): void {
    this.viewChangeRequested.emit('productos');
  }

  navegarACategoriaProductos(): void {
    this.viewChangeRequested.emit('categoria-productos');
  }

  navegarAGruposModificadores(): void {
    this.viewChangeRequested.emit('grupos-modificadores');
  }

  navegarAInventario(): void {
    this.viewChangeRequested.emit('inventario');
  }

  async procederCambioEstado(): Promise<void> {
    if (!this.comentarioParaAccion) return;
    const comentario = this.comentarioParaAccion;
    const nuevoEstado = !comentario.activo;
    try {
      const actualizado = await this.supabase.actualizarComentarioPreestablecido(comentario.id, { activo: nuevoEstado });
      const idx = this.comentarios.findIndex((c: any) => c.id === comentario.id);
      if (idx !== -1) this.comentarios[idx] = actualizado;
      this.ordenarComentarios();
      this.filtrarComentarios();
      this.toast.info('Estado cambiado', `"${comentario.texto}" ahora está ${nuevoEstado ? 'Activo' : 'Inactivo'}`);
    } catch (e) {
      console.error('Error cambiando estado de comentario:', e);
      this.toast.error('Error', 'No se pudo cambiar el estado');
    }
    this.cerrarConfirmacion();
  }

  async procederEliminacion(): Promise<void> {
    if (!this.comentarioParaAccion) return;
    const comentario = this.comentarioParaAccion;
    try {
      await this.supabase.eliminarComentarioPreestablecido(comentario.id);
      this.comentarios = this.comentarios.filter((c: any) => c.id !== comentario.id);
      this.filtrarComentarios();
      this.toast.success('Comentario eliminado', `"${comentario.texto}" eliminado correctamente`);
    } catch (e) {
      console.error('Error eliminando comentario:', e);
      this.toast.error('Error', 'No se pudo eliminar el comentario');
    }
    this.cerrarConfirmacion();
  }

  cerrarConfirmacion(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-comentario');
    }
    this.mostrarConfirmacion = false;
    this.accionConfirmacion = null;
    this.comentarioParaAccion = null;
  }

  procederAccion(): void {
    if (this.accionConfirmacion === 'cambiarEstado') {
      this.procederCambioEstado();
    } else if (this.accionConfirmacion === 'eliminar') {
      this.procederEliminacion();
    }
  }

  toggleMostrarInactivos(): void {
    this.mostrarInactivos = !this.mostrarInactivos;
    this.guardarEstadoMostrarInactivos();
    this.filtrarComentarios();
  }

  private filtrarComentarios(): void {
    if (this.mostrarInactivos) {
      this.comentariosFiltrados = [...this.comentarios];
    } else {
      this.comentariosFiltrados = this.comentarios.filter((c: any) => c.activo);
    }
  }

  private ordenarComentarios(): void {
    this.comentarios.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
  }

  private cargarEstadoMostrarInactivos(): void {
    try {
      const estadoGuardado = localStorage.getItem(this.estadoMostrarInactivosKey);
      if (estadoGuardado !== null) {
        this.mostrarInactivos = JSON.parse(estadoGuardado);
      }
    } catch (error) {
      console.warn('Error cargando estado mostrarInactivos (gestión comentarios):', error);
      this.mostrarInactivos = false;
    }
  }

  private guardarEstadoMostrarInactivos(): void {
    try {
      localStorage.setItem(this.estadoMostrarInactivosKey, JSON.stringify(this.mostrarInactivos));
    } catch (error) {
      console.warn('Error guardando estado mostrarInactivos (gestión comentarios):', error);
    }
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-comentario':
        this.cerrarModalNuevoComentario(true);
        break;
      case 'modal-confirmacion-comentario':
        this.cerrarConfirmacion(true);
        break;
      default:
        break;
    }
  }
}
