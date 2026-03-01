import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CategoriaProducto } from '../../types/api.models';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ModalHistoryManager } from '../../shared/utils/modal-history-manager';

@Component({
  selector: 'app-categoria-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-productos.component.html',
  styleUrls: ['./categoria-productos.component.css']
})
export class CategoriaProductosComponent implements OnInit, OnDestroy {
  categorias: CategoriaProducto[] = [];
  categoriasFiltradas: CategoriaProducto[] = [];
  mostrarInactivos = false;
  categoriaSeleccionada: CategoriaProducto | null = null;
  mostrarModalNuevaCategoria = false;
  mostrarModalEditarCategoria = false;
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  accionConfirmacion: 'cambiarEstado' | 'eliminar' | null = null;
  categoriaParaAccion: CategoriaProducto | null = null;

  // Sistema de notificaciones (compartido por servicio)

  // Modelo local para crear nueva categoría
  nuevaCategoriaModel: CategoriaProducto = {
    nombre: '',
    descripcion: '',
    activo: true,
    subcategorias: []
  } as unknown as CategoriaProducto;

  // Campos auxiliares para inputs de subcategorías
  nuevaSubcategoriaNueva = '';
  nuevaSubcategoriaEdit = '';
  editingSubIndex: number | null = null;
  editingSubValue: string = '';

  @Output() viewChangeRequested = new EventEmitter<string>();

  private modalHistoryManager: ModalHistoryManager;

  constructor(private supabaseService: SupabaseService, private toast: ToastService) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'categoria-productos-base');
  }

  ngOnInit(): void {
    this.cargarEstadoMostrarInactivos();
    this.cargarCategorias();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  async cargarCategorias(): Promise<void> {
    try {
      this.categorias = await this.supabaseService.getCategoriasAll();
      console.log('Categorías cargadas:', this.categorias.length);

      this.filtrarCategorias();
    } catch (error) {
      console.error('Error cargando categorías desde la API:', error);
      this.mostrarNotificacion('❌ Error de conexión', 'No se pudieron cargar las categorías desde el servidor.', 'error');
      // No hay fallback de datos de ejemplo - mostrar error al usuario
      this.categorias = [];
      this.filtrarCategorias();
    }
  }

  async cambiarEstado(categoria: CategoriaProducto): Promise<void> {
    try {
      const nuevoEstado = !categoria.activo;
      await this.supabaseService.cambiarEstadoCategoria(categoria.id!, nuevoEstado);

      // Actualizar estado local
      categoria.activo = nuevoEstado;

      this.filtrarCategorias();
      this.mostrarNotificacion('✅ Estado cambiado', `Categoría ${categoria.nombre} marcada como ${nuevoEstado ? 'activa' : 'inactiva'}`, 'success');
    } catch (error) {
      console.error('Error cambiando estado:', error);
      // Revertir cambio local en caso de error
      categoria.activo = !categoria.activo;
      this.mostrarNotificacion('❌ Error', 'No se pudo cambiar el estado', 'error');
    }
  }

  async actualizarCategoria(categoria: CategoriaProducto): Promise<void> {
    const nombre = categoria?.nombre?.trim();
    if (!nombre) {
      this.mostrarNotificacion('⚠️ Validación', 'El nombre es obligatorio', 'warning');
      return;
    }
    try {
      // Validar nombre único excluyendo el propio id
      const esUnico = await this.supabaseService.verificarNombreUnicoCategoria(nombre, categoria.id);
      if (!esUnico) {
        this.mostrarNotificacion('⚠️ Nombre duplicado', 'Ya existe una categoría con ese nombre', 'warning');
        return;
      }

      // Preparar payload limpio
      const payload: any = {
        id: categoria.id,
        nombre,
        descripcion: categoria.descripcion?.trim() || '',
        activo: !!categoria.activo,
      };
      const subsEdit = Array.isArray(categoria.subcategorias) ? categoria.subcategorias.filter(s => !!s && `${s}`.trim() !== '') : [];
      if (subsEdit.length > 0) {
        payload.subcategorias = subsEdit;
      }

      console.log('[Categoria] Actualizar payload:', payload);
      const updated = await this.supabaseService.actualizarCategoria(categoria.id!, payload);
      console.log('[Categoria] Actualizar respuesta:', updated);

      // Actualizar categoría local
      const index = this.categorias.findIndex(c => c.id === categoria.id);
      if (index !== -1) {
        this.categorias[index] = { ...updated };
      }
      this.filtrarCategorias();

      this.cerrarModalEditarCategoria();
      this.mostrarNotificacion('✅ Categoría actualizada', `Categoría ${nombre} actualizada exitosamente`, 'success');
    } catch (error: any) {
      console.error('Error actualizando categoría:', error);
      const detalle = error?.error?.error || error?.message || 'Error desconocido';
      this.mostrarNotificacion('❌ Error', `No se pudo actualizar la categoría. Detalle: ${detalle}`, 'error');
    }
  }

  async crearCategoria(categoria: CategoriaProducto): Promise<void> {
    const nombre = categoria?.nombre?.trim();
    if (!nombre) {
      this.mostrarNotificacion('⚠️ Validación', 'El nombre es obligatorio', 'warning');
      return;
    }
    try {
      // Validar nombre único
      const esUnico = await this.supabaseService.verificarNombreUnicoCategoria(nombre);
      if (!esUnico) {
        this.mostrarNotificacion('⚠️ Nombre duplicado', 'Ya existe una categoría con ese nombre', 'warning');
        return;
      }

      // Preparar payload limpio
      const payload: any = {
        nombre,
        descripcion: categoria.descripcion?.trim() || '',
        activo: !!categoria.activo,
      };
      const subsNew = Array.isArray(categoria.subcategorias) ? categoria.subcategorias.filter(s => !!s && `${s}`.trim() !== '') : [];
      if (subsNew.length > 0) {
        payload.subcategorias = subsNew;
      }

      console.log('[Categoria] Crear payload:', payload);
      const nuevaCategoria = await this.supabaseService.crearCategoria(payload);
      console.log('[Categoria] Crear respuesta:', nuevaCategoria);

      // Recargar la lista completa desde el servidor
      await this.cargarCategorias();

      this.cerrarModalNuevaCategoria();
      this.mostrarNotificacion('✅ Categoría creada', `Categoría ${nombre} creada exitosamente`, 'success');
    } catch (error: any) {
      console.error('Error creando categoría:', error);
      const detalle = error?.error?.error || error?.message || 'Error desconocido';
      this.mostrarNotificacion('❌ Error', `No se pudo crear la categoría. Detalle: ${detalle}`, 'error');
    }
  }

  async eliminarCategoria(categoria: CategoriaProducto): Promise<void> {
    try {
      await this.supabaseService.eliminarCategoria(categoria.id!);

      // Recargar la lista desde el servidor
      await this.cargarCategorias();

      this.mostrarNotificacion('✅ Categoría eliminada', `Categoría ${categoria.nombre} eliminada exitosamente`, 'success');
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      this.mostrarNotificacion('❌ Error', 'No se pudo eliminar la categoría', 'error');
    }
  }

  // Métodos de UI
  nuevaCategoria(): void {
    // Reiniciar modelo de creación
    this.nuevaCategoriaModel = {
      nombre: '',
      descripcion: '',
      activo: true,
      subcategorias: []
    } as unknown as CategoriaProducto;
    this.nuevaSubcategoriaNueva = '';
    this.modalHistoryManager.registerModalOpen('modal-nueva-categoria', this.mostrarModalNuevaCategoria);
    this.mostrarModalNuevaCategoria = true;
  }

  editarCategoria(categoria: CategoriaProducto): void {
    this.categoriaSeleccionada = { ...categoria };
    this.nuevaSubcategoriaEdit = '';
    this.editingSubIndex = null;
    this.editingSubValue = '';
    this.modalHistoryManager.registerModalOpen('modal-editar-categoria', this.mostrarModalEditarCategoria);
    this.mostrarModalEditarCategoria = true;
  }

  cerrarModalNuevaCategoria(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-nueva-categoria');
    }
    this.mostrarModalNuevaCategoria = false;
  }

  cerrarModalEditarCategoria(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-editar-categoria');
    }
    this.mostrarModalEditarCategoria = false;
    this.categoriaSeleccionada = null;
  }

  // Gestión de subcategorías (modal NUEVO)
  agregarSubcategoriaNueva(): void {
    const val = (this.nuevaSubcategoriaNueva || '').trim();
    if (!val) return;
    if (!this.nuevaCategoriaModel.subcategorias) this.nuevaCategoriaModel.subcategorias = [];
    this.nuevaCategoriaModel.subcategorias.push(val);
    this.nuevaSubcategoriaNueva = '';
  }

  eliminarSubcategoriaNueva(index: number): void {
    if (!this.nuevaCategoriaModel.subcategorias) return;
    this.nuevaCategoriaModel.subcategorias.splice(index, 1);
  }

  // Gestión de subcategorías (modal EDITAR)
  agregarSubcategoriaEdit(): void {
    const val = (this.nuevaSubcategoriaEdit || '').trim();
    if (!val || !this.categoriaSeleccionada) return;
    if (!this.categoriaSeleccionada.subcategorias) this.categoriaSeleccionada.subcategorias = [];
    this.categoriaSeleccionada.subcategorias.push(val);
    this.nuevaSubcategoriaEdit = '';
  }

  eliminarSubcategoriaEdit(index: number): void {
    if (!this.categoriaSeleccionada || !this.categoriaSeleccionada.subcategorias) return;
    this.categoriaSeleccionada.subcategorias.splice(index, 1);
  }

  // Edición inline de subcategorías (modal EDITAR)
  iniciarEdicionSubcategoria(index: number): void {
    if (!this.categoriaSeleccionada || !this.categoriaSeleccionada.subcategorias) return;
    this.editingSubIndex = index;
    this.editingSubValue = (this.categoriaSeleccionada.subcategorias[index] || '').trim();
  }

  cancelarEdicionSubcategoria(): void {
    this.editingSubIndex = null;
    this.editingSubValue = '';
  }

  guardarEdicionSubcategoria(): void {
    if (this.editingSubIndex === null || !this.categoriaSeleccionada || !this.categoriaSeleccionada.subcategorias) return;
    const nuevo = (this.editingSubValue || '').trim();
    if (!nuevo) {
      // Si queda vacío, no aplicar cambio
      this.cancelarEdicionSubcategoria();
      return;
    }
    this.categoriaSeleccionada.subcategorias[this.editingSubIndex] = nuevo;
    this.cancelarEdicionSubcategoria();
  }

  filtrarCategorias(): void {
    this.categoriasFiltradas = this.mostrarInactivos ? this.categorias : this.categorias.filter(c => c.activo);
  }

  toggleMostrarInactivos(): void {
    this.mostrarInactivos = !this.mostrarInactivos;
    this.guardarEstadoMostrarInactivos();
    this.filtrarCategorias();
  }

  private cargarEstadoMostrarInactivos(): void {
    try {
      const estadoGuardado = localStorage.getItem('categoria-productos-mostrarInactivos');
      if (estadoGuardado !== null) {
        this.mostrarInactivos = JSON.parse(estadoGuardado);
      }
    } catch (error) {
      console.warn('Error cargando estado mostrarInactivos desde localStorage:', error);
      this.mostrarInactivos = false;
    }
  }

  private guardarEstadoMostrarInactivos(): void {
    try {
      localStorage.setItem('categoria-productos-mostrarInactivos', JSON.stringify(this.mostrarInactivos));
    } catch (error) {
      console.warn('Error guardando estado mostrarInactivos en localStorage:', error);
    }
  }

  mostrarNotificacion(titulo: string, mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    switch (tipo) {
      case 'success': return this.toast.success(titulo, mensaje);
      case 'error': return this.toast.error(titulo, mensaje);
      case 'warning': return this.toast.warning(titulo, mensaje);
      default: return this.toast.info(titulo, mensaje);
    }
  }

  // Métodos de confirmación
  confirmarCambioEstado(categoria: CategoriaProducto): void {
    this.categoriaParaAccion = categoria;
    this.accionConfirmacion = 'cambiarEstado';
    this.tituloConfirmacion = 'Cambiar Estado';
    this.mensajeConfirmacion = `¿Desea cambiar el estado de la categoría "${categoria.nombre}"?`;
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-categoria', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  confirmarEliminacion(categoria: CategoriaProducto): void {
    this.categoriaParaAccion = categoria;
    this.accionConfirmacion = 'eliminar';
    this.tituloConfirmacion = 'Eliminar Categoría';
    this.mensajeConfirmacion = `¿Está seguro de que desea eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`;
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-categoria', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  procederAccion(): void {
    if (this.categoriaParaAccion && this.accionConfirmacion) {
      if (this.accionConfirmacion === 'cambiarEstado') {
        this.cambiarEstado(this.categoriaParaAccion);
      } else if (this.accionConfirmacion === 'eliminar') {
        this.eliminarCategoria(this.categoriaParaAccion);
      }
    }
    this.cerrarConfirmacion();
  }

  cerrarConfirmacion(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-categoria');
    }
    this.mostrarConfirmacion = false;
    this.categoriaParaAccion = null;
    this.accionConfirmacion = null;
  }

  // Métodos de navegación
  navegarAProductos(): void {
    console.log('Navegando a productos desde categoria-productos');
    this.viewChangeRequested.emit('productos');
  }

  navegarAGruposModificadores(): void {
    console.log('Navegando a grupos-modificadores desde categoria-productos');
    this.viewChangeRequested.emit('grupos-modificadores');
  }

  navegarAGestionComentarios(): void {
    console.log('Navegando a gestion-comentarios desde categoria-productos');
    this.viewChangeRequested.emit('gestion-comentarios');
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-nueva-categoria':
        this.cerrarModalNuevaCategoria(true);
        break;
      case 'modal-editar-categoria':
        this.cerrarModalEditarCategoria(true);
        break;
      case 'modal-confirmacion-categoria':
        this.cerrarConfirmacion(true);
        break;
      default:
        break;
    }
  }
}
