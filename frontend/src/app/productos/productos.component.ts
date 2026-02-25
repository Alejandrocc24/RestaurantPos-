import { Component, OnInit, OnDestroy, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoModalComponent, ProductoForm } from './producto-modal.component';
import { ConfirmModalComponent } from '../shared/confirm-modal';
import { InventarioComponent } from './inventario';
import { ProductosService } from '../services/productos.service';
import { Producto } from '../types/api.models';
import { ToastService } from '../shared/toast/toast.service';
import { CurrencyFormatPipe } from '../shared/pipes/currency-format.pipe';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-productos',
  standalone: true,
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ProductoModalComponent,
    ConfirmModalComponent,
    InventarioComponent,
    CurrencyFormatPipe
  ]
})
export class ProductosComponent implements OnInit, OnDestroy {
  sidebarVisible = false;
  productos: any[] = [];
  productosFiltrados: any[] = [];
  terminoBusqueda = '';
  categoriaSeleccionada = 'Todas';
  subcategoriaSeleccionada: string | null = null;
  mostrarInactivos = false;
  isMobile = false;
  touchStartX: number | null = null;
  touchStartY: number | null = null;
  tabActivo: string = 'productos';
  @Input() initialTab?: string;
  sidebarInitialized = false;
  isNavigatingBack = false;
  cargando = false;

  categorias: string[] = ['Todas'];
  subcategoriasSidebar: Record<string, string[]> = {};
  expandedCategories: Record<string, boolean> = {};

  mostrarModalProducto = false;
  productoSeleccionado: any = null;
  esEdicionProducto = false;

  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  accionConfirmacion: 'cambiarEstado' | 'eliminar' | null = null;
  productoParaAccion: Producto | null = null;

  private modalHistoryStack: string[] = [];
  private ignoreNextPopstate = false;
  private destroy$ = new Subject<void>();

  private popStateHandler = (event: PopStateEvent) => {
    if (this.ignoreNextPopstate) {
      this.ignoreNextPopstate = false;
      return;
    }

    if (!this.cerrarModalDesdeHistorial() && typeof history !== 'undefined') {
      history.pushState({ modal: 'productos-base' }, 'productos');
    }
  };

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.popStateHandler);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private pushModalHistory(id: string): void {
    if (this.modalHistoryStack[this.modalHistoryStack.length - 1] === id) {
      return;
    }

    if (typeof history !== 'undefined') {
      history.pushState({ modal: id }, 'modal');
    }
    this.modalHistoryStack.push(id);
  }

  private registerModalOpen(id: string, isOpen: boolean): void {
    if (!isOpen) {
      this.pushModalHistory(id);
    }
  }

  private removeModalHistoryEntry(id: string): void {
    if (!this.modalHistoryStack.length) {
      return;
    }

    const lastModal = this.modalHistoryStack[this.modalHistoryStack.length - 1];
    if (lastModal === id) {
      this.modalHistoryStack.pop();
      if (typeof window !== 'undefined' && typeof history !== 'undefined') {
        this.ignoreNextPopstate = true;
        history.back();
      }
      return;
    }

    const index = this.modalHistoryStack.lastIndexOf(id);
    if (index !== -1) {
      this.modalHistoryStack.splice(index, 1);
    }
  }

  private cerrarModalDesdeHistorial(): boolean {
    if (!this.modalHistoryStack.length) {
      return false;
    }

    const modalId = this.modalHistoryStack.pop();

    switch (modalId) {
      case 'producto':
        this.cerrarModalProducto(true);
        break;
      case 'confirmacion-producto':
        this.cerrarConfirmacion(true);
        break;
      default:
        break;
    }
    return true;
  }
  @Output() viewChangeRequested = new EventEmitter<string>();

  constructor(
    private productosService: ProductosService,
    private toast: ToastService
  ) {
    this.checkScreenSizeOnly();

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.popStateHandler);
    }
  }

  filtrarPorSubcategoria(categoria: string, subcategoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.subcategoriaSeleccionada = subcategoria;
    if (categoria !== 'Todas') {
      this.expandedCategories[categoria] = true;
    }
    this.filtrarProductos();

    // Cerrar sidebar en móvil
    if (this.isMobile && this.sidebarVisible) {
      setTimeout(() => this.closeSidebar(), 300);
    }
  }

  ngOnInit(): void {
    // Establecer tab activo: usar initialTab si viene del dashboard, sino 'productos'
    this.tabActivo = this.initialTab || 'productos';

    // Siempre cargar productos
    this.cargarProductos();

    // Inicializar el sidebar solo si no se ha hecho antes
    if (!this.sidebarInitialized) {
      this.initializeSidebar();
      this.sidebarInitialized = true;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSizeOnly();
  }

  // Método separado para solo verificar el tamaño de pantalla
  checkScreenSizeOnly() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Método separado para inicializar el sidebar
  initializeSidebar() {
    // El sidebar comienza siempre oculto
    this.sidebarVisible = false;

    // Configurar clases iniciales del sidebar
    setTimeout(() => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.add('transitions-enabled');
        sidebar.classList.add('collapsed');
        sidebar.classList.remove('visible');
      }
    }, this.isNavigatingBack ? 0 : 100);
  }

  // Método anterior checkScreenSize renombrado para mantener compatibilidad
  checkScreenSize() {
    this.checkScreenSizeOnly();
    this.initializeSidebar();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.productosService.getProductos(0, 500)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productos) => {
          // Normalizar categoria y estado: si viene como objeto, extraer el nombre/valor
          const productosNormalizados = (productos || []).map((p: any) => ({
            ...p,
            categoriaId: typeof p.categoria === 'object' ? p.categoria.id : p.categoriaId,
            categoria: typeof p.categoria === 'object' && p.categoria?.nombre 
              ? p.categoria.nombre 
              : p.categoria || '',
            // Convertir 'activo' (boolean) a 'estado' (string: 'activo'/'inactivo')
            estado: (typeof p.activo === 'boolean' ? p.activo : true) ? 'activo' : 'inactivo'
          }));
          
          this.productos = productosNormalizados.sort((a: any, b: any) =>
            (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'accent' })
          );
          console.log('✅ Productos cargados:', this.productos.length);
          console.log('📦 Productos:', this.productos);
          this.cargarCategoriasSidebar();
          this.filtrarProductos();
          this.cargando = false;
        },
        error: (error) => {
          console.error('❌ Error cargando productos:', error);
          this.toast.error('Error al cargar productos');
          this.cargando = false;
        }
      });
  }

  private cargarCategoriasSidebar(): void {
    // Extraer categorías de los productos cargados
    const categoriasSet = new Set<string>();
    const subcategoriasPorCategoria: Record<string, Set<string>> = {};

    this.productos.forEach(p => {
      if (p.categoria) {
        categoriasSet.add(p.categoria);
        if (!subcategoriasPorCategoria[p.categoria]) {
          subcategoriasPorCategoria[p.categoria] = new Set();
        }
        if (p.subcategoria) {
          subcategoriasPorCategoria[p.categoria].add(p.subcategoria);
        }
      }
    });

    const categoriasOrdenadas = Array.from(categoriasSet).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'accent' })
    );

    this.categorias = ['Todas', ...categoriasOrdenadas];
    this.subcategoriasSidebar = {};

    categoriasOrdenadas.forEach(cat => {
      this.subcategoriasSidebar[cat] = Array.from(subcategoriasPorCategoria[cat] || [])
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'accent' }));
    });
  }



  guardarProducto(productoForm: ProductoForm): void {
    try {
      const baseData: any = {
        nombre: productoForm.nombre,
        precio: productoForm.precio,
        categoriaId: productoForm.categoria,
        subcategoria: productoForm.subcategoria || null,
        descripcion: productoForm.descripcion || null
      };

      console.log('💾 Guardando producto:', baseData.nombre);
      console.log('   categoriaId:', baseData.categoriaId, '(tipo:', typeof baseData.categoriaId, ')');
      console.log('   Datos completos:', baseData);

      if (this.esEdicionProducto && this.productoSeleccionado?.id) {
        // Edición - usar updateProducto
        this.productosService.updateProducto(this.productoSeleccionado.id, baseData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (productoActualizado: any) => {
              if (productoActualizado) {
                // Normalizar categoria y estado si viene como objeto
                const productoNormalizado: any = {
                  ...productoActualizado,
                  categoria: typeof productoActualizado.categoria === 'object' && productoActualizado.categoria?.nombre
                    ? productoActualizado.categoria.nombre
                    : productoActualizado.categoria || '',
                  // Convertir 'activo' (boolean) a 'estado' (string: 'activo'/'inactivo')
                  estado: (typeof productoActualizado.activo === 'boolean' ? productoActualizado.activo : true) ? 'activo' : 'inactivo'
                };
                const index = this.productos.findIndex(p => p.id === this.productoSeleccionado.id);
                if (index !== -1) {
                  this.productos[index] = productoNormalizado;
                }
                this.cargarCategoriasSidebar();
                this.filtrarProductos();
                this.toast.success('✅ Producto actualizado', `"${productoForm.nombre}" actualizado correctamente`);
              }
              this.cerrarModalProducto();
            },
            error: (error) => {
              console.error('❌ Error actualizando producto:', error);
              this.toast.error('❌ Error', 'No se pudo actualizar el producto');
            }
          });
      } else {
        // Creación - usar createProducto
        this.productosService.createProducto(baseData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (productoCreado: any) => {
              if (productoCreado) {
                // Normalizar categoria y estado si viene como objeto
                const productoNormalizado: any = {
                  ...productoCreado,
                  categoria: typeof productoCreado.categoria === 'object' && productoCreado.categoria?.nombre
                    ? productoCreado.categoria.nombre
                    : productoCreado.categoria || '',
                  // Convertir 'activo' (boolean) a 'estado' (string: 'activo'/'inactivo')
                  estado: (typeof productoCreado.activo === 'boolean' ? productoCreado.activo : true) ? 'activo' : 'inactivo'
                };
                this.productos.push(productoNormalizado);
                this.cargarCategoriasSidebar();
                this.filtrarProductos();
                this.toast.success('✅ Producto creado', `"${productoForm.nombre}" creado correctamente`);
              }
              this.cerrarModalProducto();
            },
            error: (error) => {
              console.error('❌ Error creando producto:', error);
              this.toast.error('❌ Error', 'No se pudo crear el producto');
            }
          });
      }
    } catch (error) {
      console.error('Error guardando producto:', error);
      this.toast.error('❌ Error', 'Error al guardar el producto');
    }
  }

  private generarCodigo(): string {
    const ultimoProducto = this.productos
      .filter(p => p.codigo && /^\d+$/.test(p.codigo))
      .sort((a, b) => parseInt(b.codigo) - parseInt(a.codigo))[0];

    if (ultimoProducto) {
      const ultimoNumero = parseInt(ultimoProducto.codigo);
      return (ultimoNumero + 1).toString().padStart(3, '0');
    }
    return '001';
  }

  private cargarProductosEjemplo(): void {
    // Datos de ejemplo como fallback
    const productosEjemplo: Producto[] = [
      { id: '1', nombre: 'Helado de Vainilla', precio: 2.50, activo: true, categoria: 'Helados' },
      { id: '2', nombre: 'Helado de Chocolate', precio: 2.75, activo: true, categoria: 'Helados' },
      { id: '3', nombre: 'Helado de Fresa', precio: 2.50, activo: true, categoria: 'Helados' },
      { id: '4', nombre: 'Bebida de Limón', precio: 1.50, activo: true, categoria: 'Bebidas' },
      { id: '5', nombre: 'Bebida de Naranja', precio: 1.50, activo: false, categoria: 'Bebidas' }
    ];

    this.productos = productosEjemplo.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'accent' }));
    this.filtrarProductos();
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;

    // Agregar/remover clase visible para animación en todos los casos
    setTimeout(() => {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (sidebar) {
        if (this.sidebarVisible) {
          sidebar.classList.add('visible');
          sidebar.classList.remove('collapsed');
        } else {
          sidebar.classList.remove('visible');
          sidebar.classList.add('collapsed');
        }
      }

      // Overlay solo en móvil
      if (overlay && this.isMobile) {
        if (this.sidebarVisible) {
          overlay.classList.add('visible');
        } else {
          overlay.classList.remove('visible');
        }
      }
    }, 10);
  }
  // Método para resetear la navegación al volver a productos
  resetearNavegacion(): void {
    this.tabActivo = 'productos';
  }

  closeSidebar(): void {
    // Solo cerrar si realmente está abierto
    if (this.sidebarVisible) {
      this.sidebarVisible = false;
      setTimeout(() => {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) {
          sidebar.classList.remove('visible');
          sidebar.classList.add('collapsed');
        }
        if (overlay && this.isMobile) {
          overlay.classList.remove('visible');
        }
      }, 10);
    }
  }

  filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.subcategoriaSeleccionada = null;

    // Al seleccionar una categoría con subcategorías, mantenerla expandida
    if (categoria !== 'Todas' && this.subcategoriasSidebar[categoria]?.length) {
      this.expandedCategories[categoria] = true;
    } else {
      this.expandedCategories[categoria] = false;
    }

    this.filtrarProductos();

    // Solo cerrar automáticamente el sidebar en móvil
    if (this.isMobile && this.sidebarVisible) {
      setTimeout(() => {
        this.closeSidebar();
      }, 300);
    }
  }

  filtrarProductos(): void {
    console.log('🔍 Iniciando filtrado de productos...');
    console.log('📦 Total productos en this.productos:', this.productos.length);
    console.log('🏷️ Categoría seleccionada:', this.categoriaSeleccionada);
    console.log('👁️ Mostrar inactivos:', this.mostrarInactivos);
    console.log('📋 Primer producto (estructura):', this.productos[0]);

    let productosFiltrados = this.productos;
    console.log('📋 Productos antes de filtrar por categoría:', productosFiltrados.length);
    
    if (this.categoriaSeleccionada !== 'Todas' && this.categoriaSeleccionada) {
      console.log('🔄 Filtrando por categoría:', this.categoriaSeleccionada);
      productosFiltrados = this.productos.filter(p => {
        const match = (p.categoria || '').toLowerCase() === this.categoriaSeleccionada.toLowerCase();
        console.log(`  Producto "${p.nombre}": categoria="${p.categoria}" match=${match}`);
        return match;
      });
      console.log('📋 Productos después de filtrar por categoría:', productosFiltrados.length);

      const hasSubcategories = this.subcategoriasSidebar[this.categoriaSeleccionada]?.length > 0;
      console.log('🏷️ Tiene subcategorías:', hasSubcategories);

      if (hasSubcategories) {
        if (this.subcategoriaSeleccionada) {
          productosFiltrados = productosFiltrados.filter(
            p => (p.subcategoria || '') === this.subcategoriaSeleccionada
          );
          console.log('📋 Productos después de filtrar por subcategoría:', productosFiltrados.length);
        } else {
          productosFiltrados = productosFiltrados.filter(p => {
            const sub = (p.subcategoria || '').toString().trim();
            return sub.length === 0;
          });
          console.log('📋 Productos sin subcategoría:', productosFiltrados.length);
        }
      }
    }

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda.trim()) {
      console.log('🔍 Filtrando por término de búsqueda:', this.terminoBusqueda);
      productosFiltrados = productosFiltrados.filter(p =>
        p.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(this.terminoBusqueda.toLowerCase())
      );
      console.log('📋 Productos después de filtrar por búsqueda:', productosFiltrados.length);
    }

    if (!this.mostrarInactivos) {
      console.log('🔄 Filtrando productos activos...');
      const activos = productosFiltrados.filter(p => {
        const estado = (p.estado || 'activo').toLowerCase();
        const isActive = estado === 'activo';
        console.log(`  Producto "${p.nombre}": estado="${p.estado}" normalized="${estado}" active=${isActive}`);
        return isActive;
      });
      console.log('✅ Productos activos:', activos.length, 'de', productosFiltrados.length);
      productosFiltrados = activos;
    }

    console.log('📊 Productos después de filtrar (total):', productosFiltrados.length);
    console.log('📊 Productos finales:', productosFiltrados);
    this.productosFiltrados = productosFiltrados;
  }

  toggleMostrarInactivos(): void {
    this.mostrarInactivos = !this.mostrarInactivos;
    this.filtrarProductos();
  }

  isCategoriaExpandida(categoria: string): boolean {
    if (categoria === 'Todas') return false;
    return !!this.expandedCategories[categoria];
  }

  toggleCategoriaExpandida(categoria: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (categoria === 'Todas') return;
    if (!this.subcategoriasSidebar[categoria]?.length) return;
    this.expandedCategories[categoria] = !this.expandedCategories[categoria];
  }

  cambiarEstado(producto: any): void {
    const nuevoEstado = producto.estado === 'activo' ? 'inactivo' : 'activo';

    this.tituloConfirmacion = 'Confirmar Cambio de Estado';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres cambiar el estado de "${producto.nombre}" a ${nuevoEstado}?`;
    this.accionConfirmacion = 'cambiarEstado';
    this.productoParaAccion = producto;
    this.registerModalOpen('confirmacion-producto', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  eliminarProducto(producto: any): void {
    this.tituloConfirmacion = '🗑️ Eliminar Producto';
    this.mensajeConfirmacion = `¿Estás seguro de que quieres eliminar "${producto.nombre}"?`;
    this.accionConfirmacion = 'eliminar';
    this.productoParaAccion = producto;
    this.registerModalOpen('confirmacion-producto', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  nuevoProducto(): void {
    this.esEdicionProducto = false;
    this.productoSeleccionado = null;
    this.registerModalOpen('producto', this.mostrarModalProducto);
    this.mostrarModalProducto = true;
  }

  editarProducto(producto: any): void {
    this.esEdicionProducto = true;
    // Preparar el producto para edición, asegurando que categoria sea el ID
    const productoParaEditar = { ...producto };
    if (productoParaEditar.categoriaId) {
      productoParaEditar.categoria = productoParaEditar.categoriaId;
    }
    this.productoSeleccionado = productoParaEditar;
    this.registerModalOpen('producto', this.mostrarModalProducto);
    this.mostrarModalProducto = true;
  }

  cerrarModalProducto(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('producto');
    }
    this.mostrarModalProducto = false;
    this.productoSeleccionado = null;
    this.esEdicionProducto = false;
  }

  navegarACategoriaProductos(): void {
    this.tabActivo = 'categoria';
    this.viewChangeRequested.emit('categoria-productos');
  }

  navegarAGruposModificadores(): void {
    this.tabActivo = 'modificadores';
    this.viewChangeRequested.emit('grupos-modificadores');
  }

  navegarAGestionComentarios(): void {
    this.tabActivo = 'comentarios';
    this.viewChangeRequested.emit('gestion-comentarios');
  }

  cambiarTab(tab: string): void {
    this.tabActivo = tab;
  }

  handleViewChange(view: string): void {
    if (view === 'productos') {
      this.tabActivo = 'productos';
    } else if (view === 'categoria-productos') {
      this.navegarACategoriaProductos();
    } else if (view === 'grupos-modificadores') {
      this.navegarAGruposModificadores();
    } else if (view === 'gestion-comentarios') {
      this.navegarAGestionComentarios();
    } else {
      // Si es otra vista, emitir el evento al dashboard
      this.viewChangeRequested.emit(view);
    }
  }

  procederCambioEstado(): void {
    if (!this.productoParaAccion) return;
    const producto = this.productoParaAccion;
    const nuevoEstado = producto.estado === 'activo' ? 'inactivo' : 'activo';

    // Convertir estado string a activo boolean
    const datosActualizar = { activo: nuevoEstado === 'activo' };
    this.productosService.updateProducto(String(producto.id), datosActualizar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (productoActualizado) => {
          if (productoActualizado) {
            const index = this.productos.findIndex(p => p.id === producto.id);
            if (index !== -1) {
              this.productos[index] = { ...producto, estado: nuevoEstado };
              this.filtrarProductos();
            }
            this.toast.info('Estado cambiado', `"${producto.nombre}" ahora está ${nuevoEstado}`);
          }
          this.cerrarConfirmacion();
        },
        error: (error) => {
          console.error('Error cambiando estado de producto:', error);
          this.toast.error('Error', 'No se pudo cambiar el estado');
          this.cerrarConfirmacion();
        }
      });
  }

  cerrarConfirmacion(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('confirmacion-producto');
    }
    this.mostrarConfirmacion = false;
    this.accionConfirmacion = null;
    this.productoParaAccion = null;
  }

  procederAccion(): void {
    if (this.accionConfirmacion === 'cambiarEstado') {
      this.procederCambioEstado();
    } else if (this.accionConfirmacion === 'eliminar') {
      this.procederEliminacion();
    }
  }

  procederEliminacion(): void {
    if (!this.productoParaAccion) return;
    const producto = this.productoParaAccion;

    this.productosService.deleteProducto(String(producto.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (deleted) => {
          if (deleted) {
            const index = this.productos.findIndex(p => p.id === producto.id);
            if (index !== -1) {
              this.productos.splice(index, 1);
              this.filtrarProductos();
            }
            this.toast.success('Producto eliminado', `"${producto.nombre}" ha sido eliminado`);
          }
          this.cerrarConfirmacion();
        },
        error: (error) => {
          console.error('Error eliminando producto:', error);
          this.toast.error('Error', 'No se pudo eliminar el producto');
          this.cerrarConfirmacion();
        }
      });
  }



  // Método para cerrar sidebar en móvil al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isMobile && this.sidebarVisible) {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector('.sidebar');
      const toggleBtn = document.querySelector('.sidebar-toggle-btn');

      if (sidebar && !sidebar.contains(target) && !toggleBtn?.contains(target)) {
        this.closeSidebar();
      }
    }
  }

  // Método para manejar el swipe en móvil - Solo desde el borde izquierdo
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: any) {
    if (this.isMobile) {
      // Solo activar swipe si se toca cerca del borde izquierdo (primeros 20px)
      const touchX = event.touches[0].clientX;
      if (touchX <= 20) {
        this.touchStartX = touchX;
        this.touchStartY = event.touches[0].clientY;
      } else {
        this.touchStartX = null;
        this.touchStartY = null;
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: any) {
    if (this.isMobile && this.touchStartX !== null && this.touchStartY !== null) {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const diffX = this.touchStartX - touchEndX;
      const diffY = Math.abs(this.touchStartY - touchEndY);

      // Solo activar si es un swipe horizontal (no vertical) y desde el borde
      // Verificar que el movimiento horizontal sea mayor que el vertical
      if (Math.abs(diffX) > diffY && Math.abs(diffX) > 50) {
        // Swipe izquierda para abrir sidebar (solo desde el borde)
        if (diffX > 50 && !this.sidebarVisible && this.touchStartX <= 20) {
          this.toggleSidebar();
        }
        // Swipe derecha para cerrar sidebar
        else if (diffX < -50 && this.sidebarVisible) {
          this.toggleSidebar();
        }
      }

      this.touchStartX = null;
      this.touchStartY = null;
    }
  }
}
