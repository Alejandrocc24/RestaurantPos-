import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GrupoModificadorService, GrupoModificador, Modificador } from '../services/grupo-modificador.service';
import { MesasService } from '../services/mesas.service';
import { ToastService } from '../shared/toast/toast.service';
import { CategoriaService } from '../services/categoria.service';
import { ProductosService } from '../services/productos.service';
import { Producto, Mesa } from '../types/api.models';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';
import { SupabaseService } from '../services/supabase.service';
import { ApiService } from '../services/api.service';
import { SocketService } from '../services/socket.service';
import Swal from 'sweetalert2';

interface CategoriaProducto {
  id: string;
  nombre: string;
  icono?: string;
  subcategorias: string[];
}

interface PosicionMesa {
  id: string;
  nombre: string;
  x: number;
  y: number;
}

interface ProductoPedido {
  detalleId?: number | null;
  pedidoId?: number | null;
  productoId?: string | null;
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  notas?: string;
  comentario?: string; // Separado en comentariosPreestablecidos + comentarioPersonalizado
  comentariosPreestablecidos?: string[]; // Array de comentarios preestablecidos/rápidos
  comentarioPersonalizado?: string; // Comentario personalizado del usuario
  personalizacion?: string;
  modificadores?: {
    grupoId: number;
    grupoNombre: string;
    modificadores: Modificador[];
  }[];
}

// Local interfaces removed to use api.models.ts

interface ProductoRaw {
  id: number | string;
  nombre?: string | null;
  precio?: string | number | null;
  categoria?: string | null;
  subcategoria?: string | null;
  descripcion?: string | null;
  icono?: string | null;
  especial?: boolean | null;
  gruposModificadores?: number[] | null;
  configuracionGrupos?: {
    grupoId: number;
    maxSelecciones: number;
    minSelecciones: number;
  }[] | null;
}

// Local interfaces removed to use api.models.ts
interface Fruta {
  nombre: string;
  icono: string;
}

interface PasoModificador {
  titulo: string;
  descripcion: string;
  grupoId: string;
  grupoNombre: string;
  modificadores: Modificador[];
  maxSelecciones: number;
  minSelecciones: number;
  obligatorio: boolean;
  cobrarPrecio: boolean; // Indica si los modificadores de este grupo deben cobrar precio
}

interface Helado {
  nombre: string;
  icono: string;
}

interface PasoEspecial {
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.css']
})
export class MesasComponent implements OnInit, OnDestroy {
  mesas: Mesa[] = [];
  mesasFiltradas: Mesa[] = [];
  mostrarModalNuevaMesa = false;
  nuevaMesa: Partial<Mesa> = {};
  mesaSeleccionada: Mesa | null = null;
  modoEdicion = false;
  editandoMesa = false;
  mesaEditando: Mesa | null = null;

  // Control de permisos
  puedeEditarMesas = false;

  // Modal de confirmación para eliminar
  mostrarModalConfirmacion = false;
  mesaAEliminar: Mesa | null = null;

  // Modal de información de mesa
  mostrarModalInfoMesa = false;
  mesaSeleccionadaInfo: Mesa | null = null;

  // Modal de pedido
  mostrarModalPedido = false;
  pedidoActual: ProductoPedido[] = [];
  productosExistentesMesa: ProductoPedido[] = []; // Nueva variable para productos existentes
  notasPedido = '';
  categoriaSeleccionada = 'bebidas';

  // Nuevas variables para el sistema avanzado
  subcategoriaSeleccionada = '';
  subcategorias: string[] = [];
  productosFiltrados: Producto[] = [];

  // Variables para productos especiales con grupos modificadores
  productoEspecial: Producto | null = null;
  itemEditando: ProductoPedido | null = null; // Nueva variable para el item que se está editando
  indiceItemEditando: number = -1; // Índice del item en pedidoActual
  pasoActual: number = 0;
  pasosEspecial: PasoEspecial[] = [];
  pasosModificadores: PasoModificador[] = [];
  frutasSeleccionadas: string[] = [];
  heladoSeleccionado = '';
  mostrarModalEspecial = false;

  // Variables para grupos modificadores
  gruposModificadores: GrupoModificador[] = [];
  modificadoresSeleccionados: { [grupoId: number]: Modificador[] } = {};
  categoriaModificadorSeleccionada: { [grupoId: number]: string | null } = {}; // Categoría seleccionada por grupo

  // Variables para drag and drop
  mesaArrastrando: Mesa | null = null;
  posicionDragOver: string | null = null;

  // Variables para el modal de cierre de cuenta
  mostrarModalCierreCuenta = false;
  productosCobro: { [key: string]: boolean } = {};
  cantidadesCobro: { [key: string]: number } = {}; // Nueva: cantidades a cobrar por producto (clave = detalleId)
  denominacionRecibida = 0;
  denominacionManual = 0;
  cambioCalculado = 0;
  totalCuenta = 0;
  subtotalProductos = 0;
  metodoPago: 'efectivo' | 'transferencia' = 'efectivo';
  denominacionesPreestablecidas = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

  // Variables de estado
  cargandoMesas = false;
  cargandoPedido = false;
  guardandoPedido = false;

  // Variables para el modal de transferir mesa
  mostrarModalTransferirMesa = false;
  mesaDestinoSeleccionada: string | null = null;
  mesasDisponiblesParaTransferencia: Mesa[] = [];
  productosSeleccionadosTransferencia: boolean[] = [];

  // Productos disponibles para pedidos (se cargan desde la base de datos)
  categoriasProductos: CategoriaProducto[] = [];

  productos: Producto[] = []; // Productos se cargan desde la base de datos

  // Frutas y helados para productos especiales (datos de prueba - pueden eliminarse si no se usan)
  frutas: Fruta[] = [];
  helados: Helado[] = [];

  // Posiciones preestablecidas para las mesas (8x4 = 32 posiciones)
  posicionesPreestablecidas: PosicionMesa[] = [
    { id: 'pos1', nombre: 'A1', x: 0, y: 0 },
    { id: 'pos2', nombre: 'A2', x: 0, y: 1 },
    { id: 'pos3', nombre: 'A3', x: 0, y: 2 },
    { id: 'pos4', nombre: 'A4', x: 0, y: 3 },
    { id: 'pos5', nombre: 'B1', x: 1, y: 0 },
    { id: 'pos6', nombre: 'B2', x: 1, y: 1 },
    { id: 'pos7', nombre: 'B3', x: 1, y: 2 },
    { id: 'pos8', nombre: 'B4', x: 1, y: 3 },
    { id: 'pos9', nombre: 'C1', x: 2, y: 0 },
    { id: 'pos10', nombre: 'C2', x: 2, y: 1 },
    { id: 'pos11', nombre: 'C3', x: 2, y: 2 },
    { id: 'pos12', nombre: 'C4', x: 2, y: 3 },
    { id: 'pos13', nombre: 'D1', x: 3, y: 0 },
    { id: 'pos14', nombre: 'D2', x: 3, y: 1 },
    { id: 'pos15', nombre: 'D3', x: 3, y: 2 },
    { id: 'pos16', nombre: 'D4', x: 3, y: 3 },
    { id: 'pos17', nombre: 'E1', x: 4, y: 0 },
    { id: 'pos18', nombre: 'E2', x: 4, y: 1 },
    { id: 'pos19', nombre: 'E3', x: 4, y: 2 },
    { id: 'pos20', nombre: 'E4', x: 4, y: 3 },
    { id: 'pos21', nombre: 'F1', x: 5, y: 0 },
    { id: 'pos22', nombre: 'F2', x: 5, y: 1 },
    { id: 'pos23', nombre: 'F3', x: 5, y: 2 },
    { id: 'pos24', nombre: 'F4', x: 5, y: 3 },
    { id: 'pos25', nombre: 'G1', x: 6, y: 0 },
    { id: 'pos26', nombre: 'G2', x: 6, y: 1 },
    { id: 'pos27', nombre: 'G3', x: 6, y: 2 },
    { id: 'pos28', nombre: 'G4', x: 6, y: 3 },
    { id: 'pos29', nombre: 'H1', x: 7, y: 0 },
    { id: 'pos30', nombre: 'H2', x: 7, y: 1 },
    { id: 'pos31', nombre: 'H3', x: 7, y: 2 },
    { id: 'pos32', nombre: 'H4', x: 7, y: 3 }
  ];

  // Comentarios preestablecidos por categoría de producto (se cargan desde la base de datos)
  comentariosPreestablecidos: { [key: string]: string[] } = {};

  // Comentarios preestablecidos generales (para cualquier producto)
  comentariosGenerales: string[] = [];

  private modalHistoryStack: string[] = [];
  private ignoreNextPopstate = false;
  private destroy$ = new Subject<void>();

  private popStateHandler = (event: PopStateEvent) => {
    if (this.mostrarModalEspecial && this.pasoActual > 0) {
      this.pasoActual = Math.max(0, this.pasoActual - 1);
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      return;
    }

    if (this.ignoreNextPopstate) {
      this.ignoreNextPopstate = false;
      return;
    }

    if (this.cerrarModalDesdeHistorial()) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
    }
  };

  constructor(
    private grupoModificadorService: GrupoModificadorService,
    private mesasService: MesasService,
    private toast: ToastService,
    private categoriaService: CategoriaService,
    private productosService: ProductosService,
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private supabaseService: SupabaseService,
    private apiService: ApiService,
    private socketService: SocketService
  ) {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.popStateHandler);
    }
  }

  async ngOnInit(): Promise<void> {
    this.verificarPermisos();

    // Suscripciones WebSocket para actualizar mesas y productos en tiempo real
    // MESA events: recargar solo la lista de mesas (estados)
    this.socketService.listen('mesaCreada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesas());
    this.socketService.listen('mesaActualizada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesas());
    this.socketService.listen('mesaEliminada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesas());

    // ORDEN events: recargar mesas + productos (el estado de la mesa puede cambiar a OCUPADA)
    this.socketService.listen('ordenMesaActualizada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesasYProductos());
    this.socketService.listen('ordenCreada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesasYProductos());
    this.socketService.listen('ordenActualizada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesasYProductos());
    this.socketService.listen('cantidadesOrdenActualizadas').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesasYProductos());
    this.socketService.listen('ventaCreada').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarMesasYProductos());
    this.socketService.listen('ordenesOcultadas').pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarProductosMesasOcupadas());

    // Cuando el socket se reconecta (ej. pérdida temporal de red), recargar todo
    this.socketService.onReconnect$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      console.log('🔄 [Mesas] Socket reconectado, recargando datos...');
      this.cargarMesasYProductos();
    });

    try {
      console.log('🚀 Cargando datos iniciales con endpoint combo...');
      const t0 = Date.now();

      // UN SOLO request para obtener mesas + productos + categorías + grupos
      const resp: any = await firstValueFrom(this.apiService.getDatosIniciales());

      if (resp?.success && resp?.data) {
        const data = resp.data;

        // Procesar mesas
        if (data.mesas) {
          this.mesas = data.mesas.map((mesa: any) => this.normalizarMesa(mesa));
          this.mesas = this.asignarPosicionesAutomaticas(this.mesas);
          this.cargandoMesas = false;
        }

        // Procesar categorías
        if (data.categorias) {
          this.categoriasProductos = data.categorias.map((c: any) => {
            const nombreCategoria = (c.nombre || '').toString();
            let subcategoriasNormalizadas: string[] = [];
            const rawSubcategorias = c.subcategorias;
            if (Array.isArray(rawSubcategorias)) {
              subcategoriasNormalizadas = rawSubcategorias
                .map((sub: any) => typeof sub === 'string' ? sub : sub?.nombre)
                .filter((sub: string | undefined): sub is string => !!sub && sub.trim().length > 0);
            }
            return {
              id: nombreCategoria.toLowerCase().replace(/\s+/g, ''),
              nombre: nombreCategoria,
              icono: '🍽️',
              subcategorias: subcategoriasNormalizadas
            };
          });
        }

        // Procesar productos
        if (data.productos) {
          this.productos = data.productos.map((p: any) => {
            let gruposModificadores: number[] | undefined;
            let configuracionGrupos: any[] | undefined;
            const gmFuente = p.gruposModificadores || p.grupos_modificadores;
            const cgFuente = p.configuracionGrupos || p.configuracion_grupos;
            if (gmFuente) {
              try {
                gruposModificadores = typeof gmFuente === 'string' ? JSON.parse(gmFuente) : gmFuente;
              } catch (e) { gruposModificadores = undefined; }
            }
            if (cgFuente) {
              try {
                configuracionGrupos = typeof cgFuente === 'string' ? JSON.parse(cgFuente) : cgFuente;
              } catch (e) { configuracionGrupos = undefined; }
            }
            let comentarios: string[] = [];
            let comFuente = p.comentarios;
            if (typeof comFuente === 'string' && comFuente.trim().startsWith('[')) {
              try {
                comFuente = JSON.parse(comFuente);
              } catch (e) { }
            }
            if (comFuente && Array.isArray(comFuente)) {
              if (comFuente.length > 0 && typeof comFuente[0] === 'object' && comFuente[0].texto) {
                comentarios = comFuente.map((c: any) => c.texto);
              } else if (comFuente.length > 0 && typeof comFuente[0] === 'string') {
                comentarios = comFuente;
              }
            }
            return {
              id: p.id,
              nombre: p.nombre,
              precio: Number(p.precio) || 0,
              categoria: p.categoria ? (typeof p.categoria === 'string' ? p.categoria : p.categoria.nombre).toLowerCase().replace(/\s+/g, '') : null,
              subcategoria: p.subcategoria,
              descripcion: p.descripcion,
              icono: p.icono || '🍨',
              especial: p.especial || false,
              gruposModificadores,
              configuracionGrupos,
              comentarios,
              activo: p.activo !== undefined ? p.activo : true
            };
          });
        }

        // Procesar grupos modificadores
        const gruposFuente = data.gruposModificadores || data.grupos_modificadores;
        if (gruposFuente && gruposFuente.length > 0) {
          this.gruposModificadores = gruposFuente.map((g: any) => ({
            id: g.id,
            nombre: g.nombre,
            obligatorio: g.requerido || false,
            cobrarPrecio: g.cobrar_precio || false,
            modificadores: (g.opciones || []).map((op: any) => ({
              id: op.id,
              nombre: op.nombre,
              precio: Number(op.precioAdicional || op.precio_adicional || op.precio) || 0,
              precioAdicional: Number(op.precioAdicional || op.precio_adicional || op.precio) || 0,
              productoId: op.productoId || op.producto_id || null,
              producto: op.producto || null,
              estado: op.estado || (op.activo !== false ? 'activo' : 'inactivo'),
              activo: op.activo !== false,
              categoria: op.categoria || null
            }))
          }));
        } else {
          this.cargarGruposModificadoresEjemplo();
        }

        this.aplicarFiltros();
        console.log(`✅ Datos iniciales cargados en ${Date.now() - t0}ms | Mesas: ${this.mesas.length} | Productos: ${this.productos.length} | Categorías: ${this.categoriasProductos.length} | Grupos: ${this.gruposModificadores.length}`);

        // Cargar productos de mesas ocupadas (en segundo plano)
        await this.cargarProductosMesasOcupadas();
      } else {
        // Fallback: cargar de forma individual si el endpoint combo falla
        console.warn('⚠️ Endpoint combo falló, cargando datos individuales...');
        await Promise.all([
          this.cargarMesas(),
          this.cargarGruposModificadores(),
          this.cargarCategoriasDesdeDB(),
          this.cargarProductosDesdeDB()
        ]);
      }
    } catch (error) {
      console.error('Error durante la carga inicial:', error);
      // Fallback individual
      try {
        await Promise.all([
          this.cargarMesas(),
          this.cargarGruposModificadores(),
          this.cargarCategoriasDesdeDB(),
          this.cargarProductosDesdeDB()
        ]);
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        this.toast.error('Error', 'No se pudo completar la carga inicial.');
      }
    }
  }

  verificarPermisos(): void {
    const user = this.authService.getUser();
    console.log('🔐 Verificando permisos de mesas...');
    console.log('Usuario completo:', user);

    if (user) {
      // Verificar permiso específico para modo edición de mesas
      this.puedeEditarMesas = this.permissionsService.hasPermission('mesas.modo_edicion');

      console.log('👤 Usuario:', user.nombre || user.name);
      console.log('📋 Rol:', user.rol);
      console.log('🆔 Rol ID:', user.rol_id);
      console.log('✅ Puede editar mesas (modo edición):', this.puedeEditarMesas);
    } else {
      console.warn('⚠️ No hay usuario autenticado');
      this.puedeEditarMesas = false;
    }
  }

  private cargarMesas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cargandoMesas = true;
      this.mesasService.getMesas(0, 500)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (mesas) => {
            try {
              // El backend ya calcula el estado real (OCUPADA si tiene orden activa)
              this.mesas = mesas.map((mesa: any) => this.normalizarMesa(mesa));
              // Asignar posiciones automáticas si no las tienen
              this.mesas = this.asignarPosicionesAutomaticas(this.mesas);
              this.aplicarFiltros();
              console.log(`✅ ${this.mesas.length} mesas cargadas correctamente`);
              this.cargandoMesas = false;

              // Solo cargar productos para mesas que el backend confirmó como ocupadas
              await this.cargarProductosMesasOcupadas();

              resolve();
            } catch (error) {
              reject(error);
            }
          },
          error: (error) => {
            console.error('❌ Error cargando mesas:', error);
            this.toast.error('Error', 'No se pudieron cargar las mesas');
            this.mesas = [];
            this.cargandoMesas = false;
            reject(error);
          }
        });
    });
  }

  /**
   * Carga los productos de la orden activa SOLO para mesas que el backend confirmó como ocupadas.
   * La determinación de si la mesa está ocupada ya viene del backend (evita llamadas innecesarias).
   */
  private async cargarProductosMesasOcupadas(): Promise<void> {
    const mesasOcupadas = this.mesas.filter(m => m.estado === 'ocupado');
    console.log(`🔄 Cargando productos paralelos para ${mesasOcupadas.length} mesa(s) ocupada(s)...`);

    await Promise.all(mesasOcupadas.map(async (mesa) => {
      try {
        const pedidoActivo = await this.supabaseService.obtenerPedidoActivoMesa(mesa.id);
        if (pedidoActivo) {
          const productos = this.mapearProductosPedidoDesdeBackend(pedidoActivo.productos || []);
          mesa.productos = productos;
          mesa.totalCuenta = pedidoActivo.total || 0;
          console.log(`✅ Mesa ${mesa.numero}: ${productos.length} producto(s) cargado(s)`);
        } else {
          // Si no hay pedido activo, limpiar productos de la mesa
          mesa.productos = undefined;
          mesa.totalCuenta = undefined;
        }
      } catch (error: any) {
        console.warn(`⚠️ No se pudieron cargar productos de mesa ${mesa.numero}:`, error.message);
      }
    }));

    this.aplicarFiltros();
    console.log(`✅ Carga de productos completada`);
  }

  /**
   * Recarga las mesas (para obtener estados actualizados) Y luego sus productos.
   * Este es el método principal que debe usarse cuando una orden cambia,
   * ya que el estado de la mesa puede haber cambiado de DISPONIBLE a OCUPADA.
   */
  private async cargarMesasYProductos(): Promise<void> {
    try {
      await this.cargarMesas();
      // cargarMesas ya llama a cargarProductosMesasOcupadas internamente
    } catch (error) {
      console.error('❌ Error recargando mesas y productos:', error);
    }
  }

  /** @deprecated Usar cargarProductosMesasOcupadas en su lugar */
  private async cargarPedidosActivosDeMesas(): Promise<void> {
    return this.cargarProductosMesasOcupadas();
  }

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
    if (this.modalHistoryStack.length === 0) {
      return false;
    }

    const modalId = this.modalHistoryStack.pop();

    switch (modalId) {
      case 'pedido':
        this.cerrarModalPedido(true);
        break;
      case 'info':
        this.cerrarModalInfoMesa(true);
        break;
      case 'cierre':
        this.cerrarModalCierreCuenta(true);
        break;
      case 'especial':
        this.cerrarModalEspecial(true);
        break;
      case 'modo-edicion':
        this.modoEdicion = false;
        this.mesaSeleccionada = null;
        this.mesaArrastrando = null;
        break;
      case 'nueva-mesa':
        this.cerrarModalNuevaMesa(true);
        break;
      case 'transferir':
        this.cerrarModalTransferirMesa(true);
        break;
      case 'confirmacion':
        this.cerrarModalConfirmacion(true);
        break;
      default:
        if (modalId && modalId.startsWith('mesas-especial-step')) {
          this.pasoActual = Math.max(0, this.pasoActual - 1);
          return true;
        }
        break;
    }
    return true;
  }

  async cargarGruposModificadores(): Promise<void> {
    console.log('🔄 Cargando grupos modificadores desde DB...');
    try {
      const grupos = await firstValueFrom(this.grupoModificadorService.getGruposModificadores());
      if (!grupos || !Array.isArray(grupos) || grupos.length === 0) {
        console.warn('⚠️ No se obtuvieron grupos del servidor, usando datos de ejemplo');
        this.cargarGruposModificadoresEjemplo();
        return;
      }

      this.gruposModificadores = grupos;
      console.log(`✅ ${grupos.length} grupos modificadores cargados`);

      grupos.forEach(grupo => {
        console.log(`  📦 Grupo ${grupo.id}: ${grupo.nombre} (${grupo.modificadores?.length || 0} modificadores, ${grupo.obligatorio ? 'obligatorio' : 'opcional'})`);
      });
    } catch (error: any) {
      console.error('❌ Error al cargar grupos modificadores:', error);
      console.warn('📌 Usando datos de ejemplo como fallback');
      this.cargarGruposModificadoresEjemplo();
    }
  }

  cargarGruposModificadoresEjemplo(): void {
    // Datos de ejemplo para grupos modificadores
    this.gruposModificadores = [
      {
        id: 'grupo-1',
        nombre: 'Frutas',
        descripcion: 'Selecciona las frutas que desees',
        tipo: 'multiple',
        obligatorio: true,
        estado: 'activo',
        modificadores: [
          { id: 'mod-1', nombre: 'Fresa', precio: 0.50, estado: 'activo' },
          { id: 'mod-2', nombre: 'Plátano', precio: 0.50, estado: 'activo' },
          { id: 'mod-3', nombre: 'Kiwi', precio: 0.75, estado: 'activo' },
          { id: 'mod-4', nombre: 'Mango', precio: 0.75, estado: 'activo' },
          { id: 'mod-5', nombre: 'Piña', precio: 0.50, estado: 'activo' },
          { id: 'mod-6', nombre: 'Uvas', precio: 0.50, estado: 'activo' }
        ],
        maxSelecciones: 3,
        minSelecciones: 1
      },
      {
        id: 'grupo-2',
        nombre: 'Salsas',
        descripcion: 'Elige tu salsa favorita',
        tipo: 'unico',
        obligatorio: true,
        estado: 'activo',
        modificadores: [
          { id: 'mod-7', nombre: 'Chocolate', precio: 0.75, estado: 'activo' },
          { id: 'mod-8', nombre: 'Caramelo', precio: 0.75, estado: 'activo' },
          { id: 'mod-9', nombre: 'Fresa', precio: 0.75, estado: 'activo' },
          { id: 'mod-10', nombre: 'Dulce de Leche', precio: 0.75, estado: 'activo' }
        ],
        maxSelecciones: 1,
        minSelecciones: 1
      },
      {
        id: 'grupo-3',
        nombre: 'Toppings',
        descripcion: 'Adiciones para tu helado',
        tipo: 'multiple',
        obligatorio: false,
        estado: 'activo',
        modificadores: [
          { id: 'mod-11', nombre: 'Nueces', precio: 1.00, estado: 'activo' },
          { id: 'mod-12', nombre: 'Chispas de Chocolate', precio: 0.50, estado: 'activo' },
          { id: 'mod-13', nombre: 'Coco Rallado', precio: 0.50, estado: 'activo' },
          { id: 'mod-14', nombre: 'Crema Batida', precio: 0.75, estado: 'activo' }
        ],
        maxSelecciones: 2,
        minSelecciones: 0
      },
      {
        id: 'grupo-4',
        nombre: 'Decoraciones',
        descripcion: 'Elementos decorativos',
        tipo: 'multiple',
        obligatorio: false,
        estado: 'activo',
        modificadores: [
          { id: 'mod-15', nombre: 'Galletas', precio: 0.75, estado: 'activo' },
          { id: 'mod-16', nombre: 'Chocolate Decorativo', precio: 1.00, estado: 'activo' },
          { id: 'mod-17', nombre: 'Frutas Secas', precio: 0.75, estado: 'activo' }
        ],
        maxSelecciones: 3,
        minSelecciones: 0
      }
    ];
  }

  async cargarCategoriasDesdeDB(): Promise<void> {
    try {
      console.log('Cargando categorías desde DB...');
      const categorias = await firstValueFrom(this.categoriaService.getCategorias());
      if (categorias && categorias.length > 0) {
        this.categoriasProductos = categorias.map((c: any) => {
          const nombreCategoria = (c.nombre || '').toString();
          const rawSubcategorias = c.subcategorias;

          let subcategoriasNormalizadas: string[] = [];

          if (Array.isArray(rawSubcategorias)) {
            subcategoriasNormalizadas = rawSubcategorias
              .map((sub: any) => typeof sub === 'string' ? sub : sub?.nombre)
              .filter((sub: string | undefined): sub is string => !!sub && sub.trim().length > 0);
          } else if (typeof rawSubcategorias === 'string') {
            // Intentar parsear JSON, si falla dividir por comas
            try {
              const parsed = JSON.parse(rawSubcategorias);
              if (Array.isArray(parsed)) {
                subcategoriasNormalizadas = parsed
                  .map((sub: any) => typeof sub === 'string' ? sub : sub?.nombre)
                  .filter((sub: string | undefined): sub is string => !!sub && sub.trim().length > 0);
              }
            } catch (error) {
              subcategoriasNormalizadas = rawSubcategorias
                .split(',')
                .map(sub => sub.trim())
                .filter(sub => sub.length > 0);
            }
          }

          return {
            id: nombreCategoria.toLowerCase().replace(/\s+/g, ''), // Convertir nombre a id legible
            nombre: nombreCategoria,
            icono: '🍽️', // Icono por defecto
            subcategorias: subcategoriasNormalizadas
          };
        });
        console.log('Categorías cargadas:', this.categoriasProductos.length);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }

  async cargarProductosDesdeDB(): Promise<void> {
    try {
      console.log('🔄 Cargando productos desde DB...');
      const productos = await this.productosService.getProductos().toPromise();

      if (!productos || productos.length === 0) {
        console.warn('⚠️ No se encontraron productos en la base de datos');
        this.productos = []; // Asegurar que esté vacío si no hay productos
        return;
      }

      this.productos = productos.map((p: any) => {
        // Parsear grupos modificadores si vienen como string
        // Buscar en ambos formatos: camelCase (gruposModificadores) y snake_case (grupos_modificadores)
        let gruposModificadores: number[] | undefined;
        let configuracionGrupos: any[] | undefined;

        const gmFuente = p.gruposModificadores || p.grupos_modificadores;
        const cgFuente = p.configuracionGrupos || p.configuracion_grupos;

        if (gmFuente) {
          try {
            gruposModificadores = typeof gmFuente === 'string'
              ? JSON.parse(gmFuente)
              : gmFuente;
            console.log(`✅ Producto ${p.id} tiene gruposModificadores:`, gruposModificadores);
          } catch (e) {
            console.warn(`Error parseando gruposModificadores para producto ${p.id}:`, e);
            gruposModificadores = undefined;
          }
        }

        if (cgFuente) {
          try {
            configuracionGrupos = typeof cgFuente === 'string'
              ? JSON.parse(cgFuente)
              : cgFuente;
            console.log(`✅ Producto ${p.id} tiene configuracionGrupos:`, configuracionGrupos);
          } catch (e) {
            console.warn(`Error parseando configuracionGrupos para producto ${p.id}:`, e);
            configuracionGrupos = undefined;
          }
        }

        // Parsear comentarios si vienen como string
        let comentarios: string[] = [];
        if (p.comentarios && Array.isArray(p.comentarios)) {
          try {
            // Los comentarios pueden venir como:
            // 1. Array de objetos {id, texto, ...} desde el backend
            // 2. Array de strings (legacy)
            // 3. String JSON (legacy)

            if (typeof p.comentarios === 'string') {
              comentarios = JSON.parse(p.comentarios);
            } else if (Array.isArray(p.comentarios)) {
              // Verificar si son objetos con propiedad 'texto'
              if (p.comentarios.length > 0 && typeof p.comentarios[0] === 'object' && p.comentarios[0].texto) {
                comentarios = p.comentarios.map((c: any) => c.texto);
              } else if (p.comentarios.length > 0 && typeof p.comentarios[0] === 'string') {
                comentarios = p.comentarios;
              }
            }
          } catch (e) {
            console.warn(`Error parseando comentarios para producto ${p.id}:`, e);
            comentarios = [];
          }
        }

        return {
          id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio) || 0,
          categoria: p.categoria ? (typeof p.categoria === 'string' ? p.categoria : p.categoria.nombre).toLowerCase().replace(/\s+/g, '') : null,
          subcategoria: p.subcategoria,
          descripcion: p.descripcion,
          icono: p.icono || '🍨',
          especial: p.especial || false,
          gruposModificadores: gruposModificadores,
          configuracionGrupos: configuracionGrupos,
          comentarios: comentarios,
          activo: p.activo !== undefined ? p.activo : true
        };
      });

      const productosEspeciales = this.productos.filter(p => p.especial);
      const productosConComentarios = this.productos.filter(p => (p as any).comentarios?.length > 0);
      console.log(`✅ ${this.productos.length} productos cargados desde DB (${productosEspeciales.length} especiales, ${productosConComentarios.length} con comentarios)`);

      // Log de productos especiales para debugging
      if (productosEspeciales.length > 0) {
        console.log('📋 Productos especiales:', productosEspeciales.map(p => ({
          id: p.id,
          nombre: p.nombre,
          grupos: p.gruposModificadores?.length || 0,
          config: p.configuracionGrupos?.length || 0
        })));
      }

      // Log de productos con comentarios
      if (productosConComentarios.length > 0) {
        console.log('💬 Productos con comentarios:', productosConComentarios.map(p => ({
          id: p.id,
          nombre: p.nombre,
          comentarios: (p as any).comentarios
        })));
      }
    } catch (error) {
      console.error('❌ Error cargando productos desde DB:', error);
      this.productos = []; // Asegurar que esté vacío en caso de error
      this.toast.error('Error', 'No se pudieron cargar los productos. Por favor, recarga la página.');
    }
  }


  private cargarMesasEjemplo(): void {
    // Datos de ejemplo como fallback
    const muestras: Partial<Mesa>[] = [
      { id: '1', numero: 1, capacidad: 4, estado: 'disponible', activo: true },
      {
        id: '2',
        numero: 2,
        capacidad: 4,
        estado: 'ocupado',
        tiempoOcupacion: new Date(),
        cliente: 'Juan Pérez',
        totalCuenta: 25.5,
        ubicacion: 'salon',
        posicion: 'pos2',
        horaApertura: new Date(Date.now() - 45 * 60 * 1000),
        productos: [
          { id: '1', nombre: 'Hamburguesa Clásica', precio: 12.5, cantidad: 1, subtotal: 12.5, notas: 'Sin cebolla' },
          { id: '2', nombre: 'Papas Fritas', precio: 4.5, cantidad: 1, subtotal: 4.5 },
          { id: '3', nombre: 'Coca Cola', precio: 2.5, cantidad: 2, subtotal: 5.0 },
          { id: '4', nombre: 'Helado de Vainilla', precio: 3.5, cantidad: 1, subtotal: 3.5 }
        ],
        activo: true,
      },
      { id: '3', numero: 3, capacidad: 6, estado: 'disponible', ubicacion: 'salon', posicion: 'pos3', activo: true },
      { id: '4', numero: 4, capacidad: 2, estado: 'disponible', ubicacion: 'salon', posicion: 'pos4', activo: true },
      { id: '5', numero: 5, capacidad: 8, estado: 'disponible', ubicacion: 'salon', posicion: 'pos5', activo: true },
      { id: '6', numero: 6, capacidad: 4, estado: 'disponible', ubicacion: 'salon', posicion: 'pos6', activo: true },
      { id: '7', numero: 7, capacidad: 6, estado: 'disponible', ubicacion: 'salon', posicion: 'pos7', activo: true },
      { id: '8', numero: 8, capacidad: 4, estado: 'disponible', ubicacion: 'salon', posicion: 'pos8', activo: true },
      { id: '9', numero: 9, capacidad: 6, estado: 'disponible', ubicacion: 'salon', posicion: 'pos9', activo: true },
      { id: '10', numero: 10, capacidad: 4, estado: 'disponible', ubicacion: 'salon', posicion: 'pos10', activo: true },
      {
        id: '11',
        numero: 11,
        capacidad: 4,
        estado: 'ocupado',
        tiempoOcupacion: new Date(),
        cliente: 'Ana López',
        totalCuenta: 18.75,
        ubicacion: 'salon',
        posicion: 'pos11',
        horaApertura: new Date(Date.now() - 20 * 60 * 1000),
        productos: [
          { id: '5', nombre: 'Pizza Margherita', precio: 15.0, cantidad: 1, subtotal: 15.0 },
          { id: '6', nombre: 'Agua Mineral', precio: 1.75, cantidad: 2, subtotal: 3.5 }
        ],
        activo: true,
      },
      { id: '12', numero: 12, capacidad: 6, estado: 'disponible', ubicacion: 'salon', posicion: 'pos12', activo: true },
      { id: '13', numero: 13, capacidad: 2, estado: 'disponible', ubicacion: 'salon', posicion: 'pos13', activo: true },
      { id: '14', numero: 14, capacidad: 8, estado: 'disponible', ubicacion: 'salon', posicion: 'pos14', activo: true },
      { id: '15', numero: 15, capacidad: 4, estado: 'disponible', ubicacion: 'salon', posicion: 'pos15', activo: true },
      { id: '16', numero: 16, capacidad: 6, estado: 'disponible', ubicacion: 'salon', posicion: 'pos16', activo: true },
      { id: '17', numero: 17, capacidad: 4, estado: 'disponible', ubicacion: 'salon', posicion: 'pos17', activo: true },
      {
        id: '18',
        numero: 18,
        capacidad: 6,
        estado: 'ocupado',
        tiempoOcupacion: new Date(),
        cliente: 'Laura Torres',
        totalCuenta: 32.0,
        ubicacion: 'salon',
        posicion: 'pos18',
        horaApertura: new Date(Date.now() - 75 * 60 * 1000),
        productos: [
          { id: '7', nombre: 'Pasta Carbonara', precio: 18.0, cantidad: 2, subtotal: 36.0, notas: 'Extra queso' },
          { id: '9', nombre: 'Tiramisú', precio: 6.0, cantidad: 1, subtotal: 6.0 }
        ],
        activo: true,
      },
      { id: '19', numero: 19, capacidad: 4, estado: 'disponible', ubicacion: 'salon', posicion: 'pos19', activo: true },
      { id: '20', numero: 20, capacidad: 8, estado: 'disponible', ubicacion: 'salon', posicion: 'pos20', activo: true }
    ];

    this.mesas = muestras.map((mesa) => this.normalizarMesa(mesa));
    this.aplicarFiltros();
  }

  private asignarPosicionesAutomaticas(mesas: Mesa[]): Mesa[] {
    // Obtener posiciones ya ocupadas
    const posicionesOcupadas = new Set(
      mesas.filter(m => m.posicion).map(m => m.posicion)
    );

    let proximaPosicion = 0;

    return mesas.map(mesa => {
      // Si la mesa no tiene posición, asignarle una automáticamente
      if (!mesa.posicion && proximaPosicion < this.posicionesPreestablecidas.length) {
        // Buscar la siguiente posición disponible
        while (
          proximaPosicion < this.posicionesPreestablecidas.length &&
          posicionesOcupadas.has(this.posicionesPreestablecidas[proximaPosicion].id)
        ) {
          proximaPosicion++;
        }

        if (proximaPosicion < this.posicionesPreestablecidas.length) {
          mesa.posicion = this.posicionesPreestablecidas[proximaPosicion].id;
          posicionesOcupadas.add(mesa.posicion);
          proximaPosicion++;
        }
      }
      return mesa;
    });
  }

  private normalizarMesa(raw: any): Mesa {
    // convert backend enum to frontend-friendly lowercase value
    const rawEstado = String(raw?.estado ?? '').toLowerCase();
    const estado = rawEstado === 'ocupado' || rawEstado === 'ocupada' ? 'ocupado' : 'disponible';
    const ubicacion = raw?.ubicacion === 'terraza' ? 'terraza' : 'salon';

    const mesa: Mesa = {
      id: String(raw?.id ?? ''),
      numero: Number(raw?.numero ?? 0),
      capacidad: Number(raw?.capacidad ?? 0),
      estado,
      ubicacion,
      posicion: raw?.posicion ?? null,
      productos: Array.isArray(raw?.productos) ? [...raw.productos] : undefined,
      cliente: raw?.cliente ?? undefined,
      totalCuenta: typeof raw?.totalCuenta === 'number' ? raw.totalCuenta : raw?.total_cuenta ?? undefined,
      tiempoOcupacion: raw?.tiempoOcupacion
        ? new Date(raw.tiempoOcupacion)
        : raw?.tiempo_ocupacion
          ? new Date(raw.tiempo_ocupacion)
          : undefined,
      horaApertura: raw?.horaApertura
        ? new Date(raw.horaApertura)
        : raw?.hora_apertura
          ? new Date(raw.hora_apertura)
          : undefined,
      activo: typeof raw?.activo === 'boolean' ? raw.activo : true,
    };

    return mesa;
  }

  private actualizarMesaEnColeccion(mesaActualizada: Mesa): void {
    const index = this.mesas.findIndex((m) => m.id === mesaActualizada.id);
    let nuevasMesas = [...this.mesas];
    if (index !== -1) {
      nuevasMesas[index] = { ...nuevasMesas[index], ...mesaActualizada };
    } else {
      nuevasMesas.push({ ...mesaActualizada });
    }
    this.mesas = nuevasMesas;
  }



  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada = mesa;
  }

  aplicarFiltros(): void {
    this.mesasFiltradas = [...this.mesas];
  }

  cambiarEstadoMesa(mesa: Mesa, nuevoEstado: Mesa['estado']): void {
    const estadoAnterior = mesa.estado;
    const tiempoAnterior = mesa.tiempoOcupacion;
    const horaAnterior = mesa.horaApertura;

    mesa.estado = nuevoEstado;
    if (nuevoEstado === 'ocupado') {
      mesa.tiempoOcupacion = new Date();
      mesa.horaApertura = new Date();
    } else if (nuevoEstado === 'disponible') {
      delete mesa.tiempoOcupacion;
      delete mesa.cliente;
      delete mesa.totalCuenta;
    }

    this.mesasService.updateMesa(mesa.id, { estado: nuevoEstado })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mesaActualizada) => {
          if (mesaActualizada) {
            const mesaNormalizada = this.normalizarMesa(mesaActualizada);
            mesaNormalizada.tiempoOcupacion = mesa.tiempoOcupacion;
            mesaNormalizada.horaApertura = mesa.horaApertura;
            mesaNormalizada.cliente = mesa.cliente;
            mesaNormalizada.totalCuenta = mesa.totalCuenta;
            this.actualizarMesaEnColeccion(mesaNormalizada);
          }
          this.aplicarFiltros();
        },
        error: (error) => {
          console.error('Error actualizando mesa:', error);
          mesa.estado = estadoAnterior;
          mesa.tiempoOcupacion = tiempoAnterior;
          mesa.horaApertura = horaAnterior;
          this.toast.error('Error', 'No se pudo actualizar el estado de la mesa');
        }
      });
  }

  abrirModalNuevaMesa(): void {
    this.nuevaMesa = { ubicacion: 'salon' };
    this.registerModalOpen('nueva-mesa', this.mostrarModalNuevaMesa);
    this.mostrarModalNuevaMesa = true;
  }



  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'disponible': return '#4caf50';
      case 'ocupado': return '#ff9800';
      default: return '#9e9e9e';
    }
  }

  obtenerIconoEstado(estado: string): string {
    switch (estado) {
      case 'disponible': return '🟢';
      case 'ocupado': return '🟠';
      default: return '⚪';
    }
  }

  calcularTiempoOcupacion(mesa: Mesa): string {
    if (!mesa.tiempoOcupacion) return '0m';

    const ahora = new Date();
    const diferencia = ahora.getTime() - mesa.tiempoOcupacion.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(minutos / 60);

    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    }
    return `${minutos}m`;
  }

  // Métodos del modo de edición
  toggleModoEdicion(): void {
    this.modoEdicion = !this.modoEdicion;
    if (this.modoEdicion) {
      this.pushModalHistory('modo-edicion');
    } else {
      this.removeModalHistoryEntry('modo-edicion');
      this.mesaSeleccionada = null;
      this.mesaArrastrando = null;
    }
  }

  getMesaEnPosicion(posicion: PosicionMesa): Mesa | undefined {
    const mesa = this.mesas.find(mesa => mesa.posicion === posicion.id);
    return mesa;
  }

  posicionOcupada(posicionId: string): boolean {
    return this.mesas.some(mesa => mesa.posicion === posicionId);
  }

  manejarClickPosicion(posicion: PosicionMesa): void {
    if (this.modoEdicion) {
      const mesa = this.getMesaEnPosicion(posicion);
      if (mesa) {
        this.seleccionarMesa(mesa);
      }
    }
  }



  editarMesa(mesa: Mesa): void {
    if (!this.modoEdicion) return;

    this.editandoMesa = true;
    this.mesaEditando = mesa;
    this.nuevaMesa = { ...mesa };
    this.registerModalOpen('nueva-mesa', this.mostrarModalNuevaMesa);
    this.mostrarModalNuevaMesa = true;
  }

  eliminarMesa(mesa: Mesa): void {
    if (!this.modoEdicion) return;

    this.mesaAEliminar = mesa;
    this.registerModalOpen('confirmacion', this.mostrarModalConfirmacion);
    this.mostrarModalConfirmacion = true;
  }

  confirmarEliminacion(): void {
    if (!this.mesaAEliminar) {
      return;
    }

    const mesa = this.mesaAEliminar;

    this.mesasService.deleteMesa(mesa.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eliminada) => {
          if (eliminada) {
            this.mesas = this.mesas.filter((m) => m.id !== mesa.id);
            this.aplicarFiltros();
            if (this.mesaSeleccionada?.id === mesa.id) {
              this.mesaSeleccionada = null;
            }
            this.toast.success('Mesa eliminada', `La mesa ${mesa.numero} se eliminó correctamente`);
          }
          this.cerrarModalConfirmacion();
        },
        error: (error) => {
          console.error('Error eliminando mesa:', error);
          this.toast.error('Error', 'No se pudo eliminar la mesa');
          this.cerrarModalConfirmacion();
        }
      });
  }

  cerrarModalConfirmacion(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('confirmacion');
    }
    this.mostrarModalConfirmacion = false;
    this.mesaAEliminar = null;
  }

  // Métodos para el modal de información de mesa
  async abrirModalInfoMesa(mesa: Mesa): Promise<void> {
    this.mesaSeleccionadaInfo = mesa;
    this.registerModalOpen('info', this.mostrarModalInfoMesa);
    this.mostrarModalInfoMesa = true;

    if (this.mesaSeleccionadaInfo?.estado === 'ocupado') {
      try {
        console.log('🔄 Recargando datos frescos de mesa:', mesa.id);

        // Recargar pedido activo para obtener datos frescos
        const pedidoActivo = await this.supabaseService.obtenerPedidoActivoMesa(this.mesaSeleccionadaInfo.id);

        if (pedidoActivo && (Array.isArray(pedidoActivo.productos) || Array.isArray(pedidoActivo.items))) {
          const productos = this.mapearProductosPedidoDesdeBackend(pedidoActivo.productos || pedidoActivo.items || []);

          this.mesaSeleccionadaInfo.productos = productos;
          this.mesaSeleccionadaInfo.totalCuenta = pedidoActivo.total ?? this.calcularTotalMesa(this.mesaSeleccionadaInfo);
          console.log('✅ Pedido recargado:', productos.length, 'productos');

          const index = this.mesas.findIndex((m) => m.id === this.mesaSeleccionadaInfo!.id);
          if (index !== -1) {
            this.mesas[index] = { ...this.mesaSeleccionadaInfo };
            this.aplicarFiltros();
          }
        }
      } catch (error) {
        console.error('Error cargando pedido activo al abrir info de mesa:', error);
      }
    }
  }

  cerrarModalInfoMesa(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('info');
    }
    this.mostrarModalInfoMesa = false;
    this.mesaSeleccionadaInfo = null;
  }

  cerrarModalCierreCuenta(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('cierre');
    }
    this.mostrarModalCierreCuenta = false;
    this.productosCobro = {};
    this.cantidadesCobro = {};
    this.denominacionRecibida = 0;
    this.denominacionManual = 0;
    this.cambioCalculado = 0;
    this.totalCuenta = 0;
    this.subtotalProductos = 0;
    this.productosExistentesMesa = []; // Limpiar productos existentes al cerrar
    this.pedidoActual = []; // Limpiar pedido actual también
  }

  iniciarPedido(mesa: Mesa): void {
    if (mesa.estado === 'disponible') {
      mesa.estado = 'ocupado';
      mesa.tiempoOcupacion = new Date();
      mesa.horaApertura = new Date();
      mesa.productos = [];
    }
  }

  cerrarCuenta(mesa: Mesa): void {
    if (mesa.estado === 'ocupado') {
      this.mesaSeleccionadaInfo = mesa;
      this.registerModalOpen('cierre', this.mostrarModalCierreCuenta);
      this.mostrarModalCierreCuenta = true;
      this.inicializarModalCierreCuenta();
    }
  }

  async liberarMesaSinPedido(mesa: Mesa): Promise<void> {
    if (!mesa || mesa.estado !== 'ocupado') return;

    // Verificar que no tenga productos
    if (mesa.productos && mesa.productos.length > 0) {
      this.toast.warning('Atención', 'Esta mesa tiene productos. Usa "Cerrar Cuenta" para cobrar.');
      return;
    }

    try {
      console.log('🔓 Liberando mesa sin pedido:', mesa.numero);

      // Actualizar mesa a disponible
      await this.supabaseService.actualizarMesa(mesa.id, {
        estado: 'disponible'
      });

      // Actualizar localmente
      const index = this.mesas.findIndex(m => m.id === mesa.id);
      if (index !== -1) {
        this.mesas[index].estado = 'disponible';
        delete this.mesas[index].tiempoOcupacion;
        delete this.mesas[index].cliente;
        delete this.mesas[index].totalCuenta;
        delete this.mesas[index].productos;
        delete this.mesas[index].horaApertura;
      }

      this.aplicarFiltros();
      this.toast.success('Mesa liberada', `Mesa ${mesa.numero} ahora está disponible`);
      this.cerrarModalInfoMesa();
    } catch (error) {
      console.error('❌ Error liberando mesa:', error);
      this.toast.error('Error', 'No se pudo liberar la mesa');
    }
  }

  calcularTotalMesa(mesa: Mesa): number {
    if (!mesa.productos || mesa.productos.length === 0) return 0;
    return mesa.productos.reduce((total, producto) => total + producto.subtotal, 0);
  }

  // Función helper para formatear moneda colombiana
  trackByProductoId(index: number, item: ProductoPedido): string {
    return `${item.id}-${item.nombre}-${item.precio}-${item.cantidad}`;
  }

  formatearMoneda(valor: number): string {
    // Redondear a entero para evitar decimales
    const valorRedondeado = Math.round(valor);

    // Formatear con separadores de miles
    return valorRedondeado.toLocaleString('es-CO');
  }

  async eliminarProductoComandado(index: number, producto: ProductoPedido): Promise<void> {
    if (!this.mesaSeleccionadaInfo || !this.mesaSeleccionadaInfo.productos) return;

    // Confirmar eliminación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🗑️</div>
          <p style="font-size: 1.1rem; color: #495057; margin-bottom: 0.5rem;">
            <strong>${producto.nombre}</strong>
          </p>
          <p style="font-size: 0.9rem; color: #6c757d;">
            Esta acción eliminará el producto del pedido
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="fas fa-trash"></i> Sí, eliminar',
      cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'swal-wide',
        confirmButton: 'btn-eliminar-swal',
        cancelButton: 'btn-cancelar-swal'
      }
    });

    if (!result.isConfirmed) return;

    try {
      console.log('🗑️ Eliminando producto del pedido:', producto.nombre);

      // Guardar referencia al ID de la mesa antes de cualquier modificación
      const mesaId = this.mesaSeleccionadaInfo.id;
      const pedidoId = producto.pedidoId;

      if (!pedidoId) {
        this.toast.error('Error', 'No se pudo identificar el pedido a modificar');
        return;
      }

      // Preparar el producto para ser eliminado en el backend (cantidad a 0)
      const productosAActualizar = [{
        detalleId: producto.detalleId,
        productoId: producto.productoId || producto.id,
        cantidad: 0,
        precioUnitario: producto.precio
      }];

      // Enviar solicitud de actualización de cantidades al backend
      const resultado = await this.supabaseService.actualizarCantidadesProductos(pedidoId, productosAActualizar, false);

      // Eliminar producto del array local
      this.mesaSeleccionadaInfo.productos.splice(index, 1);
      this.mesaSeleccionadaInfo.totalCuenta = this.calcularTotalMesa(this.mesaSeleccionadaInfo);

      // Actualizar en el array principal de mesas localmente
      const indexMesa = this.mesas.findIndex(m => m.id === mesaId);

      // Si el pedido se cerró (no quedan productos), liberamos la mesa localmente
      // El backend ya lo manejó en la base de datos a través de actualizar_cantidades_orden
      if (resultado && resultado.pedidoCerrado) {
        console.log('📭 No quedan productos, liberando mesa...');
        if (indexMesa !== -1) {
          this.mesas[indexMesa].estado = 'disponible';
          delete this.mesas[indexMesa].tiempoOcupacion;
          delete this.mesas[indexMesa].cliente;
          delete this.mesas[indexMesa].totalCuenta;
          delete this.mesas[indexMesa].productos;
          delete this.mesas[indexMesa].horaApertura;
        }

        this.aplicarFiltros();
        this.toast.success('Producto eliminado', 'Mesa liberada (sin productos)');
        this.cerrarModalInfoMesa();
      } else {
        // La mesa sigue ocupada, solo guardamos el estado local
        if (indexMesa !== -1) {
          this.mesas[indexMesa] = { ...this.mesaSeleccionadaInfo };
        }
        this.aplicarFiltros();
        this.toast.success('Producto eliminado', `${producto.nombre} eliminado del pedido`);
      }

    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      this.toast.error('Error', 'No se pudo eliminar el producto');
    }
  }

  async actualizarMesa(): Promise<void> {
    if (!this.mesaEditando || !this.nuevaMesa.numero || !this.nuevaMesa.capacidad) {
      return;
    }

    const cambios: Record<string, any> = {
      numero: this.nuevaMesa.numero,
      capacidad: this.nuevaMesa.capacidad,
    };

    cambios['posicion'] = this.nuevaMesa.posicion ?? this.mesaEditando.posicion ?? null;

    if (this.nuevaMesa.ubicacion) {
      cambios['ubicacion'] = this.nuevaMesa.ubicacion;
    }

    this.mesasService.updateMesa(this.mesaEditando.id, cambios)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mesaActualizada) => {
          const normalizada = mesaActualizada
            ? this.normalizarMesa(mesaActualizada)
            : {
              ...this.mesaEditando,
              ...cambios,
            } as Mesa;

          this.actualizarMesaEnColeccion(normalizada);
          this.aplicarFiltros();
          this.toast.success('Mesa actualizada', 'Los cambios se guardaron correctamente');
          this.cerrarModalNuevaMesa();
        },
        error: (error) => {
          console.error('Error actualizando mesa:', error);
          this.toast.error('Error', 'No se pudo actualizar la mesa');
        }
      });
  }

  agregarMesa(): void {
    if (!this.nuevaMesa.numero || !this.nuevaMesa.capacidad) {
      return;
    }

    let posicion = this.nuevaMesa.posicion ?? null;
    if (!posicion) {
      const posicionDisponible = this.posicionesPreestablecidas.find(pos => !this.posicionOcupada(pos.id));
      posicion = posicionDisponible ? posicionDisponible.id : null;
    }

    const payload: Partial<Mesa> = {
      numero: this.nuevaMesa.numero,
      capacidad: this.nuevaMesa.capacidad,
      estado: 'disponible',
      ubicacion: 'salon',
      posicion,
      activo: true,
    };

    this.mesasService.createMesa(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (mesaCreada) => {
          if (mesaCreada) {
            const mesaNormalizada = this.normalizarMesa(mesaCreada);
            this.actualizarMesaEnColeccion(mesaNormalizada);
            this.aplicarFiltros();
          }

          this.toast.success('Mesa creada', 'La mesa se registró correctamente');
          this.cerrarModalNuevaMesa();
        },
        error: (error) => {
          console.error('Error creando mesa:', error);
          const mensaje = error?.error?.message || 'No se pudo crear la mesa';
          this.toast.error('Error', mensaje);
        }
      });
  }

  // Sobrescribir el método cerrarModalNuevaMesa para limpiar el estado
  cerrarModalNuevaMesa(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('nueva-mesa');
    }
    this.mostrarModalNuevaMesa = false;
    this.editandoMesa = false;
    this.mesaEditando = null;
    this.nuevaMesa = {};
  }

  // Métodos para drag and drop
  onDragStart(event: DragEvent, mesa: Mesa): void {
    if (!this.modoEdicion) return;

    this.mesaArrastrando = mesa;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', mesa.id.toString());
    }
  }

  onDragOver(event: DragEvent, posicionId: string): void {
    if (!this.modoEdicion || !this.mesaArrastrando) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';

    // Solo permitir drop si la posición está vacía o es diferente a la actual
    const mesaEnPosicion = this.getMesaEnPosicion({ id: posicionId, nombre: '', x: 0, y: 0 });
    if (!mesaEnPosicion || mesaEnPosicion.id !== this.mesaArrastrando.id) {
      this.posicionDragOver = posicionId;
    }
  }

  onDragLeave(event: DragEvent, posicionId: string): void {
    if (this.posicionDragOver === posicionId) {
      this.posicionDragOver = null;
    }
  }

  async onDrop(event: DragEvent, posicionId: string): Promise<void> {
    if (!this.modoEdicion || !this.mesaArrastrando) return;

    event.preventDefault();
    this.posicionDragOver = null;

    const mesaArrastrada = this.mesaArrastrando;
    const posicionOriginal = mesaArrastrada.posicion ?? null;
    const mesaEnPosicion = this.getMesaEnPosicion({ id: posicionId, nombre: '', x: 0, y: 0 });

    if (mesaEnPosicion && mesaEnPosicion.id === mesaArrastrada.id) {
      this.mesaArrastrando = null;
      return;
    }

    try {
      if (mesaEnPosicion && mesaEnPosicion.id !== mesaArrastrada.id) {
        await Promise.all([
          this.supabaseService.actualizarMesa(mesaArrastrada.id, { posicion: posicionId }),
          this.supabaseService.actualizarMesa(mesaEnPosicion.id, { posicion: posicionOriginal }),
        ]);

        mesaArrastrada.posicion = posicionId;
        mesaEnPosicion.posicion = posicionOriginal;
        this.actualizarMesaEnColeccion({ ...mesaArrastrada });
        this.actualizarMesaEnColeccion({ ...mesaEnPosicion });
      } else {
        await this.supabaseService.actualizarMesa(mesaArrastrada.id, { posicion: posicionId });
        mesaArrastrada.posicion = posicionId;
        this.actualizarMesaEnColeccion({ ...mesaArrastrada });
      }

      this.aplicarFiltros();
    } catch (error) {
      console.error('Error actualizando posición de mesas:', error);
      this.toast.error('Error', 'No se pudo actualizar la posición de la mesa');
    } finally {
      this.mesaArrastrando = null;
    }
  }

  // Actualizar el método crearMesaEnPosicion para que no requiera posición específica
  crearMesaEnPosicion(): void {
    if (!this.modoEdicion) return;

    this.nuevaMesa = {
      ubicacion: 'salon',
      estado: 'disponible'
    };
    this.editandoMesa = false;
    this.mesaEditando = null;
    this.registerModalOpen('nueva-mesa', this.mostrarModalNuevaMesa);
    this.mostrarModalNuevaMesa = true;
  }

  // Métodos para el modal de pedido
  async abrirModalPedido(): Promise<void> {
    this.registerModalOpen('pedido', this.mostrarModalPedido);
    this.mostrarModalPedido = true;
    this.cargandoPedido = true;

    // Si la mesa está ocupada, cargar pedido activo desde la API
    if (this.mesaSeleccionadaInfo?.estado === 'ocupado') {
      try {
        const pedidoActivo = await this.supabaseService.obtenerPedidoActivoMesa(this.mesaSeleccionadaInfo.id);

        if (pedidoActivo && (pedidoActivo.productos || pedidoActivo.items)) {
          console.log('📦 Pedido activo cargado:', pedidoActivo);
          // Convertir los items del pedido al formato local
          const productos = this.mapearProductosPedidoDesdeBackend(pedidoActivo.productos || pedidoActivo.items || []);

          // Guardar productos existentes en variable separada, pero NO en pedidoActual
          this.productosExistentesMesa = [...productos];

          // Iniciar pedidoActual vacío para que solo se muestren los nuevos productos en el modal
          this.pedidoActual = [];

          // Actualizar la mesa con los productos del pedido (para mostrar en la info de la mesa)
          this.mesaSeleccionadaInfo.productos = [...productos];
          this.mesaSeleccionadaInfo.totalCuenta = pedidoActivo.total ?? this.calcularTotalMesa(this.mesaSeleccionadaInfo);

          const index = this.mesas.findIndex((m) => m.id === this.mesaSeleccionadaInfo!.id);
          if (index !== -1) {
            this.mesas[index] = { ...this.mesaSeleccionadaInfo };
            this.aplicarFiltros();
          }
        } else {
          this.productosExistentesMesa = [];
          this.pedidoActual = [];
        }
      } catch (error) {
        console.error('❌ Error cargando pedido activo:', error);
        this.productosExistentesMesa = [];
        this.pedidoActual = [];
      }
    } else {
      this.productosExistentesMesa = [];
      this.pedidoActual = [];
    }

    this.notasPedido = '';
    this.categoriaSeleccionada = this.categoriasProductos[0]?.id || 'bebidas';
    this.subcategoriaSeleccionada = '';
    this.subcategorias = [];
    this.productosFiltrados = [];
    this.seleccionarCategoria(this.categoriaSeleccionada);
    this.cargandoPedido = false;
  }

  cerrarModalPedido(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('pedido');
    }
    this.mostrarModalPedido = false;
    this.pedidoActual = [];
    this.productosExistentesMesa = []; // Limpiar productos existentes
    this.notasPedido = '';
  }

  get productosPorCategoria(): Producto[] {
    return this.productos.filter(p => p.categoria === this.categoriaSeleccionada);
  }

  agregarProductoAlPedido(producto: Producto): void {
    const itemExistente = this.pedidoActual.find(item => item.nombre === producto.nombre);

    if (itemExistente) {
      itemExistente.cantidad++;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
    } else {
      const nuevoItem: ProductoPedido = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        subtotal: producto.precio,
        notas: '',
        comentario: '',
        comentariosPreestablecidos: [],
        comentarioPersonalizado: ''
      };
      this.pedidoActual.push(nuevoItem);
    }
  }

  incrementarCantidad(index: number): void {
    const item = this.pedidoActual[index];
    const nuevaCantidad = item.cantidad + 1;
    const nuevoSubtotal = nuevaCantidad * item.precio;

    // Crear un nuevo objeto para asegurar que Angular detecte el cambio
    this.pedidoActual[index] = {
      ...item,
      cantidad: nuevaCantidad,
      subtotal: nuevoSubtotal
    };

    // Forzar la detección de cambios reasignando el array
    this.pedidoActual = [...this.pedidoActual];
  }

  decrementarCantidad(index: number): void {
    const item = this.pedidoActual[index];
    if (item.cantidad > 1) {
      const nuevaCantidad = item.cantidad - 1;
      const nuevoSubtotal = nuevaCantidad * item.precio;

      // Crear un nuevo objeto para asegurar que Angular detecte el cambio
      this.pedidoActual[index] = {
        ...item,
        cantidad: nuevaCantidad,
        subtotal: nuevoSubtotal
      };

      // Forzar la detección de cambios reasignando el array
      this.pedidoActual = [...this.pedidoActual];
    }
  }

  eliminarItemPedido(index: number): void {
    // Crear un nuevo array sin el elemento eliminado para asegurar que Angular detecte el cambio
    this.pedidoActual = this.pedidoActual.filter((_, i) => i !== index);
  }

  calcularTotalPedido(): number {
    return this.pedidoActual.reduce((total, item) => total + item.subtotal, 0);
  }

  async confirmarPedido(): Promise<void> {
    if (!this.mesaSeleccionadaInfo || this.pedidoActual.length === 0) {
      this.toast.error('Error', 'No hay productos en el pedido');
      return;
    }

    this.guardandoPedido = true;
    try {
      // Enviar solo los productos nuevos del pedidoActual
      // El backend decidirá si crear un nuevo pedido o agregar al existente
      const itemsParaEnviar: ProductoPedido[] = [...this.pedidoActual];

      console.log('📤 Enviando productos:', {
        productos: itemsParaEnviar.length,
        nombres: itemsParaEnviar.map(p => p.nombre),
        mesaOcupada: this.mesaSeleccionadaInfo.estado === 'ocupado'
      });

      // Preparar los items para enviar al backend
      const items = itemsParaEnviar.map(item => {
        // Combinar comentarios preestablecidos y personalizado
        let comentarioFinal = '';
        if (item.comentariosPreestablecidos && item.comentariosPreestablecidos.length > 0) {
          comentarioFinal = item.comentariosPreestablecidos.join(', ');
        }
        if (item.comentarioPersonalizado) {
          comentarioFinal = comentarioFinal
            ? `${comentarioFinal} - ${item.comentarioPersonalizado}`
            : item.comentarioPersonalizado;
        }

        return {
          productoId: item.productoId ?? item.id,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.subtotal,
          notas: item.notas || this.notasPedido || null,
          comentario: comentarioFinal || null,
          personalizacion: item.personalizacion || null,
          modificadores: item.modificadores || []
        };
      });

      const payload = {
        usuarioId: 1, // ID del usuario actual
        notas: this.notasPedido || null,
        items: items
      };

      console.log('📤 Enviando pedido:', payload);

      // Enviar pedido al backend
      const pedidoCreado = await this.supabaseService.guardarPedidoMesa(this.mesaSeleccionadaInfo.id, payload);

      if (pedidoCreado && pedidoCreado.data) {
        console.log('✅ Pedido guardado:', pedidoCreado);

        const orden = pedidoCreado.data;

        // Actualizar la mesa localmente
        this.mesaSeleccionadaInfo.estado = 'ocupado';

        // Si la mesa estaba disponible, actualizar tiempos
        if (!this.mesaSeleccionadaInfo.tiempoOcupacion) {
          this.mesaSeleccionadaInfo.tiempoOcupacion = new Date();
          this.mesaSeleccionadaInfo.horaApertura = new Date();
        }

        // Obtener todos los productos del pedido desde la respuesta del backend
        const productosCompletos = this.mapearProductosPedidoDesdeBackend(orden.productos || []);
        this.mesaSeleccionadaInfo.productos = productosCompletos;

        // Actualizar productos existentes para la próxima comanda
        this.productosExistentesMesa = productosCompletos;

        // Calcular el total acumulado de la mesa
        this.mesaSeleccionadaInfo.totalCuenta = orden.total || this.calcularTotalMesa(this.mesaSeleccionadaInfo);

        // Actualizar la mesa en el array principal
        const index = this.mesas.findIndex(m => m.id === this.mesaSeleccionadaInfo!.id);
        if (index !== -1) {
          this.mesas[index] = { ...this.mesaSeleccionadaInfo };
        }

        this.aplicarFiltros();
        this.cerrarModalPedido();

        const nuevosProductos = this.pedidoActual.length;
        const mensaje = this.productosExistentesMesa.length > 0
          ? `${nuevosProductos} producto(s) agregado(s)`
          : `${items.length} productos agregados`;

        this.toast.success('Pedido confirmado', `Mesa ${this.mesaSeleccionadaInfo.numero}: ${mensaje}`);
      }
    } catch (error) {
      console.error('❌ Error al confirmar pedido:', error);
      this.toast.error('Error', 'No se pudo guardar el pedido. Verifica la conexión.');
    } finally {
      this.guardandoPedido = false;
    }
  }

  // Nuevos métodos para el sistema avanzado
  seleccionarCategoria(categoriaId: string): void {
    if (this.categoriaSeleccionada === categoriaId) {
      // Si la categoría ya está seleccionada, la deseleccionamos (cerrar acordeón)
      this.categoriaSeleccionada = '';
      this.subcategoriaSeleccionada = '';
      this.subcategorias = [];
      this.productosFiltrados = [];
      console.log('🔄 Categoría deseleccionada. Productos filtrados limpiados.');
    } else {
      // Si es una nueva categoría, seleccionarla y filtrar
      this.categoriaSeleccionada = categoriaId;
      this.subcategoriaSeleccionada = '';
      const categoria = this.categoriasProductos.find(c => c.id === categoriaId);
      this.subcategorias = categoria ? categoria.subcategorias : [];
      this.filtrarProductos();
      console.log(`✅ Categoría seleccionada: ${categoriaId}. Subcategorías: ${this.subcategorias.length}`);
    }
  }

  seleccionarSubcategoria(subcategoria: string): void {
    this.subcategoriaSeleccionada = subcategoria;
    this.filtrarProductos();
  }

  filtrarProductos(): void {
    this.productosFiltrados = this.productos.filter(producto => {
      const coincideCategoria = !this.categoriaSeleccionada || producto.categoria === this.categoriaSeleccionada;
      const coincideSubcategoria = !this.subcategoriaSeleccionada || producto.subcategoria === this.subcategoriaSeleccionada;
      return coincideCategoria && coincideSubcategoria;
    });
  }

  seleccionarProducto(producto: Producto): void {
    if (producto.especial) {
      this.abrirModalEspecial(producto);
    } else {
      this.agregarProductoAlPedido(producto);
    }
  }

  // Modal de productos especiales con grupos modificadores
  abrirModalEspecial(producto: Producto, itemExistente?: ProductoPedido, indice?: number): void {
    console.log('🎨 Abriendo modal especial para:', producto.nombre);
    console.log('  - Grupos modificadores:', producto.gruposModificadores);
    console.log('  - Configuración grupos:', producto.configuracionGrupos);

    // Si hay un item existente, estamos editando
    if (itemExistente && indice !== undefined) {
      this.itemEditando = itemExistente;
      this.indiceItemEditando = indice;
      console.log('  📝 Modo edición - Item existente:', itemExistente);
    } else {
      this.itemEditando = null;
      this.indiceItemEditando = -1;
    }

    this.productoEspecial = producto;
    this.pasoActual = 0;
    this.modificadoresSeleccionados = {};
    this.categoriaModificadorSeleccionada = {};

    // Si estamos editando, precargar los modificadores seleccionados
    if (this.itemEditando && this.itemEditando.modificadores) {
      this.itemEditando.modificadores.forEach(grupo => {
        this.modificadoresSeleccionados[grupo.grupoId] = [...grupo.modificadores];
      });
      console.log('  ✅ Modificadores precargados:', this.modificadoresSeleccionados);
    }

    // Crear pasos basados en los grupos modificadores del producto
    if (producto.gruposModificadores && producto.configuracionGrupos && producto.gruposModificadores.length > 0) {
      console.log('  ✅ Producto tiene grupos modificadores configurados');
      console.log('    Grupos disponibles en memoria:', this.gruposModificadores.length);
      console.log('    Grupos del producto:', producto.gruposModificadores);

      this.pasosModificadores = producto.configuracionGrupos.map(config => {
        const cGrupoId = config.grupoId || config.grupo_id;
        const cMinSelecciones = config.minSelecciones !== undefined ? config.minSelecciones : config.min_selecciones;
        const cMaxSelecciones = config.maxSelecciones !== undefined ? config.maxSelecciones : config.max_selecciones;

        const grupo = this.gruposModificadores.find(g => g.id === cGrupoId);
        if (grupo) {
          console.log(`    📦 Paso creado: ${grupo.nombre} (min: ${cMinSelecciones}, max: ${cMaxSelecciones}, cobra: ${grupo.cobrarPrecio ? 'SÍ' : 'NO'}, modificadores: ${grupo.modificadores?.length || 0})`);
          return {
            titulo: grupo.nombre,
            descripcion: grupo.descripcion,
            grupoId: grupo.id,
            grupoNombre: grupo.nombre,
            modificadores: (grupo.modificadores || []).filter(m => {
              const isModActive = m.estado === 'activo' || (m as any).activo === true || (m as any).activo === undefined;
              let isProdActive = true;
              if (m.productoId) {
                // If it's linked to a product, ensure the product is in the active products list
                const prodSource = this.productos.find(p => String(p.id) === String(m.productoId));
                if (!prodSource) isProdActive = false;
              }
              return isModActive && isProdActive;
            }),
            maxSelecciones: cMaxSelecciones,
            minSelecciones: cMinSelecciones,
            obligatorio: grupo.obligatorio,
            cobrarPrecio: grupo.cobrarPrecio || false
          };
        } else {
          console.warn(`    ⚠️ Grupo ${cGrupoId} no encontrado en gruposModificadores. Grupos disponibles: ${this.gruposModificadores.map(g => g.id).join(', ')}`);
        }
        return null;
      }).filter(paso => paso !== null) as PasoModificador[];

      if (this.pasosModificadores.length === 0) {
        console.warn('  ⚠️ No se pudieron crear pasos, usando fallback');
        this.usarFallbackEspecial();
        this.registerModalOpen('especial', this.mostrarModalEspecial);
        this.mostrarModalEspecial = true;
        return;
      }

      // Agregar paso de confirmación
      this.pasosModificadores.push({
        titulo: 'Confirmar Pedido',
        descripcion: 'Revisa los detalles de tu pedido personalizado',
        grupoId: '',
        grupoNombre: 'Confirmación',
        modificadores: [],
        maxSelecciones: 0,
        minSelecciones: 0,
        obligatorio: false,
        cobrarPrecio: false
      });

      this.pasosEspecial = this.pasosModificadores.map(paso => ({
        titulo: paso.titulo,
        descripcion: paso.descripcion
      }));

      console.log(`  ✅ ${this.pasosModificadores.length - 1} pasos de modificadores + 1 paso de confirmación`);
    } else {
      console.log('  ℹ️ Producto especial sin grupos modificadores, usando fallback');
      this.usarFallbackEspecial();
      this.registerModalOpen('especial', this.mostrarModalEspecial);
      this.mostrarModalEspecial = true;
      return;
    }

    this.registerModalOpen('especial', this.mostrarModalEspecial);
    this.mostrarModalEspecial = true;
  }

  private usarFallbackEspecial(): void {
    // Fallback para productos especiales sin grupos modificadores
    this.pasosEspecial = [
      { titulo: 'Selecciona 3 frutas', descripcion: 'Elige las frutas que quieres en tu plato especial' },
      { titulo: 'Elige el sabor de helado', descripcion: 'Selecciona tu sabor favorito de helado' },
      { titulo: 'Confirma tu pedido', descripcion: 'Revisa los detalles de tu plato especial' }
    ];
    this.pasosModificadores = [];
  }

  cerrarModalEspecial(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('especial');
    }
    this.mostrarModalEspecial = false;
    this.productoEspecial = null;
    this.itemEditando = null; // Limpiar item editando
    this.indiceItemEditando = -1;
    this.pasoActual = 0;
    this.frutasSeleccionadas = [];
    this.heladoSeleccionado = '';
    this.modificadoresSeleccionados = {};
    this.categoriaModificadorSeleccionada = {};
    this.pasosModificadores = [];
  }

  // Métodos para manejar modificadores
  toggleModificador(grupoId: number, modificador: Modificador): void {
    if (!this.modificadoresSeleccionados[grupoId]) {
      this.modificadoresSeleccionados[grupoId] = [];
    }

    const paso = this.pasosModificadores[this.pasoActual];
    if (!paso) return;

    // Contar cuántas veces está seleccionado este modificador
    const cantidadActual = this.modificadoresSeleccionados[grupoId].filter(m => m.id === modificador.id).length;
    const totalSeleccionados = this.modificadoresSeleccionados[grupoId].length;

    // Si ya está seleccionado, quitar una instancia
    if (cantidadActual > 0) {
      const index = this.modificadoresSeleccionados[grupoId].findIndex(m => m.id === modificador.id);
      if (index > -1) {
        this.modificadoresSeleccionados[grupoId].splice(index, 1);
        console.log(`➖ Removido: ${modificador.nombre} (quedan ${cantidadActual - 1})`);
      }
    } else {
      // Si no está seleccionado y hay espacio, agregarlo
      if (totalSeleccionados < paso.maxSelecciones) {
        this.modificadoresSeleccionados[grupoId].push(modificador);
        console.log(`➕ Agregado: ${modificador.nombre} (total: ${cantidadActual + 1})`);
      } else {
        console.log(`⚠️ Límite alcanzado: máximo ${paso.maxSelecciones} selecciones`);
      }
    }
  }

  // Agregar modificador (para botones +)
  agregarModificador(grupoId: number, modificador: Modificador): void {
    if (!this.modificadoresSeleccionados[grupoId]) {
      this.modificadoresSeleccionados[grupoId] = [];
    }

    const paso = this.pasosModificadores[this.pasoActual];
    if (!paso) return;

    const totalSeleccionados = this.modificadoresSeleccionados[grupoId].length;

    if (totalSeleccionados < paso.maxSelecciones) {
      this.modificadoresSeleccionados[grupoId].push(modificador);
      const cantidad = this.modificadoresSeleccionados[grupoId].filter(m => m.id === modificador.id).length;
      console.log(`➕ Agregado: ${modificador.nombre} (cantidad: ${cantidad})`);
    }
  }

  // Quitar modificador (para botones -)
  quitarModificador(grupoId: number, modificador: Modificador): void {
    if (!this.modificadoresSeleccionados[grupoId]) return;

    const index = this.modificadoresSeleccionados[grupoId].findIndex(m => m.id === modificador.id);
    if (index > -1) {
      this.modificadoresSeleccionados[grupoId].splice(index, 1);
      const cantidad = this.modificadoresSeleccionados[grupoId].filter(m => m.id === modificador.id).length;
      console.log(`➖ Removido: ${modificador.nombre} (cantidad: ${cantidad})`);
    }
  }

  // Métodos legacy para productos especiales sin grupos modificadores
  toggleFruta(fruta: string): void {
    const index = this.frutasSeleccionadas.indexOf(fruta);
    if (index > -1) {
      this.frutasSeleccionadas.splice(index, 1);
    } else if (this.frutasSeleccionadas.length < 3) {
      this.frutasSeleccionadas.push(fruta);
    }
  }

  seleccionarHelado(helado: string): void {
    this.heladoSeleccionado = helado;
  }

  puedeContinuar(): boolean {
    // Si es un producto con grupos modificadores
    if (this.pasosModificadores && this.pasosModificadores.length > 0) {
      if (this.pasoActual >= this.pasosModificadores.length - 1) {
        return true; // Último paso siempre se puede continuar
      }

      const paso = this.pasosModificadores[this.pasoActual];
      if (paso) {
        const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
        if (paso.obligatorio) {
          return seleccionados.length >= paso.minSelecciones && seleccionados.length <= paso.maxSelecciones;
        } else {
          return seleccionados.length <= paso.maxSelecciones;
        }
      }
      return true;
    }

    // Lógica legacy para productos especiales sin grupos modificadores
    if (this.pasoActual === 0) {
      return this.frutasSeleccionadas.length === 3;
    } else if (this.pasoActual === 1) {
      return this.heladoSeleccionado !== '';
    }
    return true;
  }

  esPasoDisponible(pasoIndex: number): boolean {
    // Siempre se puede ir a pasos anteriores
    if (pasoIndex < this.pasoActual) {
      return true;
    }

    // El paso actual siempre está disponible
    if (pasoIndex === this.pasoActual) {
      return true;
    }

    // Solo se puede avanzar al siguiente paso si el actual está completo
    if (pasoIndex === this.pasoActual + 1) {
      return this.puedeContinuar();
    }

    // No se puede saltar pasos hacia adelante
    return false;
  }

  irAPaso(pasoIndex: number): void {
    if (this.esPasoDisponible(pasoIndex)) {
      if (pasoIndex < this.pasoActual) {
        // Siempre se puede retroceder a un paso anterior disponible
        this.pasoActual = pasoIndex;
      } else if (pasoIndex === this.pasoActual + 1 && this.puedeContinuar()) {
        // Solo se puede avanzar al siguiente paso si el actual está completo
        this.pasoActual = pasoIndex;
      }
    }
  }

  pasoAnterior(): void {
    if (this.pasoActual > 0) {
      this.pasoActual--;
    }
  }

  pasoSiguiente(): void {
    if (this.puedeContinuar() && this.pasoActual < this.pasosEspecial.length - 1) {
      this.pasoActual++;
    }
  }

  confirmarProductoEspecial(): void {
    if (!this.productoEspecial) {
      console.error('❌ No hay producto especial seleccionado');
      return;
    }

    console.log('✅ Confirmando producto especial:', this.productoEspecial.nombre);

    let personalizacion = '';
    let precioTotal = this.productoEspecial.precio;
    let modificadores: any[] = [];

    // Si es un producto con grupos modificadores
    if (this.pasosModificadores && this.pasosModificadores.length > 0) {
      console.log('  📦 Procesando grupos modificadores...');

      this.pasosModificadores.forEach(paso => {
        if (paso.grupoId !== '') { // Excluir el paso de confirmación
          const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
          console.log(`    - ${paso.grupoNombre}: ${seleccionados.length} seleccionados`);

          if (seleccionados.length > 0) {
            const grupoModificadores = {
              grupoId: paso.grupoId,
              grupoNombre: paso.grupoNombre,
              cobrarPrecio: paso.cobrarPrecio || false,
              modificadores: seleccionados
            };
            modificadores.push(grupoModificadores);

            // Calcular precio adicional solo si el grupo debe cobrar
            if (paso.cobrarPrecio) {
              const precioAdicional = seleccionados.reduce((sum, m) => sum + m.precio, 0);
              precioTotal += precioAdicional;
              console.log(`      Precio adicional: $${precioAdicional.toFixed(3)} (grupo cobra)`);
            } else {
              console.log(`      Sin cargo adicional (grupo no cobra)`);
            }

            personalizacion += `${paso.grupoNombre}: ${seleccionados.map(m => m.nombre).join(', ')}; `;
          }
        }
      });

      console.log(`  💰 Precio total: $${precioTotal.toFixed(3)}`);
    } else {
      // Lógica legacy para productos especiales sin grupos modificadores
      console.log('  ℹ️ Usando personalización legacy (frutas y helado)');
      personalizacion = `Frutas: ${this.frutasSeleccionadas.join(', ')}, Helado: ${this.heladoSeleccionado}`;
    }

    const productoPersonalizado: ProductoPedido = {
      id: this.productoEspecial.id,
      productoId: this.productoEspecial.id,
      nombre: this.productoEspecial.nombre, // Solo el nombre base
      precio: precioTotal,
      cantidad: this.itemEditando ? this.itemEditando.cantidad : 1, // Mantener cantidad si se está editando
      subtotal: precioTotal * (this.itemEditando ? this.itemEditando.cantidad : 1),
      personalizacion: personalizacion.trim(),
      modificadores: modificadores,
      comentario: this.itemEditando?.comentario || '' // Mantener comentario si se está editando
    };

    console.log('  ✅ Producto personalizado creado:', productoPersonalizado);

    // Si estamos editando, actualizar el item existente
    if (this.itemEditando && this.indiceItemEditando >= 0) {
      this.pedidoActual[this.indiceItemEditando] = productoPersonalizado;
      this.toast.success('Producto actualizado', `${this.productoEspecial.nombre} modificado correctamente`);
    } else {
      // Si es nuevo, agregarlo
      this.pedidoActual.push(productoPersonalizado);
      this.toast.success('Producto agregado', `${this.productoEspecial.nombre} agregado al pedido`);
    }

    this.cerrarModalEspecial();
  }

  // Métodos auxiliares para el modal de grupos modificadores
  esModificadorSeleccionado(grupoId: number | undefined, modificadorId: number): boolean {
    if (!grupoId) return false;
    const seleccionados = this.modificadoresSeleccionados[grupoId] || [];
    return seleccionados.some(m => m.id === modificadorId);
  }

  puedeSeleccionarModificador(grupoId: number | undefined): boolean {
    if (!grupoId) return false;
    const seleccionados = this.modificadoresSeleccionados[grupoId] || [];
    const paso = this.pasosModificadores[this.pasoActual];
    if (paso) {
      return seleccionados.length < paso.maxSelecciones;
    }
    return true;
  }

  obtenerCantidadSeleccionada(grupoId: number | undefined): number {
    if (!grupoId) return 0;
    return (this.modificadoresSeleccionados[grupoId] || []).length;
  }

  obtenerCantidadModificador(grupoId: number | undefined, modificadorId: number): number {
    if (!grupoId) return 0;
    const seleccionados = this.modificadoresSeleccionados[grupoId] || [];
    return seleccionados.filter(m => m.id === modificadorId).length;
  }

  // Agrupar modificadores por categoría
  agruparModificadoresPorCategoria(modificadores: Modificador[]): { [categoria: string]: Modificador[] } {
    const agrupados: { [categoria: string]: Modificador[] } = {};

    modificadores.forEach(modificador => {
      const categoria = modificador.categoria && modificador.categoria.trim() !== ''
        ? modificador.categoria.trim()
        : 'Sin categoría';

      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(modificador);
    });

    return agrupados;
  }

  // Obtener las categorías ordenadas (Sin categoría al final)
  obtenerCategoriasOrdenadas(modificadores: Modificador[]): string[] {
    const agrupados = this.agruparModificadoresPorCategoria(modificadores);
    const categorias = Object.keys(agrupados);

    // Si solo hay una categoría (probablemente "Sin categoría"), retornar array vacío para no mostrar botones
    if (categorias.length <= 1) {
      return [];
    }

    // Ordenar: categorías con nombre primero, "Sin categoría" al final
    return categorias.sort((a, b) => {
      if (a === 'Sin categoría') return 1;
      if (b === 'Sin categoría') return -1;
      return a.localeCompare(b);
    });
  }

  // Seleccionar categoría de modificador para filtrar
  seleccionarCategoriaModificador(grupoId: number, categoria: string | null): void {
    this.categoriaModificadorSeleccionada[grupoId] = categoria;
  }

  // Obtener la categoría seleccionada para un grupo
  obtenerCategoriaSeleccionada(grupoId: number): string | null {
    return this.categoriaModificadorSeleccionada[grupoId] || null;
  }

  // Obtener modificadores filtrados por categoría seleccionada
  obtenerModificadoresFiltrados(grupoId: number, modificadores: Modificador[]): Modificador[] {
    const categoriaSeleccionada = this.obtenerCategoriaSeleccionada(grupoId);

    if (!categoriaSeleccionada || categoriaSeleccionada === 'Todos') {
      return modificadores;
    }

    return modificadores.filter(modificador => {
      const categoria = modificador.categoria && modificador.categoria.trim() !== ''
        ? modificador.categoria.trim()
        : 'Sin categoría';
      return categoria === categoriaSeleccionada;
    });
  }

  calcularPrecioTotal(): number {
    if (!this.productoEspecial) return 0;

    let precioTotal = this.productoEspecial.precio;

    // Si es un producto con grupos modificadores
    if (this.pasosModificadores && this.pasosModificadores.length > 0) {
      this.pasosModificadores.forEach(paso => {
        if (paso.grupoId !== '' && paso.cobrarPrecio) { // Excluir el paso de confirmación y solo cobrar si el grupo lo indica
          const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
          const precioAdicional = seleccionados.reduce((sum, m) => sum + m.precio, 0);
          precioTotal += precioAdicional;
        }
      });
    }

    return precioTotal;
  }

  inicializarModalCierreCuenta(): void {
    if (this.mesaSeleccionadaInfo?.productos) {
      this.totalCuenta = this.calcularTotalMesa(this.mesaSeleccionadaInfo);
      this.subtotalProductos = 0;

      // Inicializar todos los productos con sus cantidades completas
      this.productosCobro = {};
      this.cantidadesCobro = {};
      this.mesaSeleccionadaInfo.productos.forEach(producto => {
        const key = producto.detalleId ?? producto.id;
        this.productosCobro[key] = true; // Marcar todos como seleccionados por defecto
        this.cantidadesCobro[key] = producto.cantidad; // Cantidad completa por defecto
      });

      // Calcular subtotal con todos seleccionados
      this.calcularSubtotalProductos();

      this.metodoPago = 'efectivo';
      this.denominacionRecibida = 0;
      this.cambioCalculado = 0;
    }
  }

  toggleProductoCobro(key: string | number): void {
    this.productosCobro[key] = !this.productosCobro[key];

    // Si se deselecciona, poner cantidad en 0; si se selecciona, restaurar cantidad original
    if (!this.productosCobro[key]) {
      this.cantidadesCobro[key] = 0;
    } else {
      const producto = this.mesaSeleccionadaInfo?.productos?.find(p => (p.detalleId ?? p.id) === key);
      if (producto) {
        this.cantidadesCobro[key] = producto.cantidad;
      }
    }

    // Crear nuevas referencias para forzar la detección de cambios de Angular
    this.productosCobro = { ...this.productosCobro };
    this.cantidadesCobro = { ...this.cantidadesCobro };
    this.calcularSubtotalProductos();
  }

  calcularSubtotalProductos(): void {
    if (!this.mesaSeleccionadaInfo?.productos) return;

    this.subtotalProductos = this.mesaSeleccionadaInfo.productos
      .filter(producto => {
        const key = producto.detalleId ?? producto.id;
        return this.productosCobro[key];
      })
      .reduce((total, producto) => {
        const key = producto.detalleId ?? producto.id;
        const cantidadACobrar = this.cantidadesCobro[key] || 0;
        const precioUnitario = producto.precio;
        return total + (cantidadACobrar * precioUnitario);
      }, 0);

    this.calcularCambio();
  }

  calcularCambio(): void {
    this.cambioCalculado = this.denominacionRecibida - this.subtotalProductos;
  }

  // Métodos para manejar cantidades individuales
  incrementarCantidadCobro(key: string | number): void {
    const producto = this.mesaSeleccionadaInfo?.productos?.find(p => (p.detalleId ?? p.id) === key);
    if (!producto) return;

    const cantidadActual = this.cantidadesCobro[key] || 0;
    if (cantidadActual < producto.cantidad) {
      this.cantidadesCobro[key] = cantidadActual + 1;
      this.productosCobro[key] = true; // Asegurar que esté seleccionado
      // Crear nuevas referencias para forzar la detección de cambios de Angular
      this.cantidadesCobro = { ...this.cantidadesCobro };
      this.productosCobro = { ...this.productosCobro };
      this.calcularSubtotalProductos();
    }
  }

  decrementarCantidadCobro(key: string | number): void {
    const cantidadActual = this.cantidadesCobro[key] || 0;
    if (cantidadActual > 0) {
      this.cantidadesCobro[key] = cantidadActual - 1;
      if (this.cantidadesCobro[key] === 0) {
        this.productosCobro[key] = false; // Deseleccionar si llega a 0
      }
      // Crear nuevas referencias para forzar la detección de cambios de Angular
      this.cantidadesCobro = { ...this.cantidadesCobro };
      this.productosCobro = { ...this.productosCobro };
      this.calcularSubtotalProductos();
    }
  }

  // Nuevos métodos para el modal de cierre de cuenta
  onMetodoPagoChange(): void {
    if (this.metodoPago === 'transferencia') {
      // Para transferencia, no necesitamos denominación ni cambio
      this.denominacionRecibida = 0;
      this.cambioCalculado = 0;
    } else {
      // Para efectivo, reinicializar denominación
      this.denominacionRecibida = 0;
      this.calcularCambio();
    }
  }

  seleccionarDenominacion(denominacion: number): void {
    this.denominacionRecibida = denominacion;
    this.denominacionManual = 0; // Limpiar manual al seleccionar predefinida
    this.calcularCambio();
  }

  onDenominacionManualFocus(): void {
    // Limpiar el campo cuando se hace focus si está en 0
    if (this.denominacionManual === 0) {
      this.denominacionManual = null as any;
    }
  }

  onDenominacionManualChange(): void {
    if (this.denominacionManual > 0) {
      this.denominacionRecibida = this.denominacionManual;
      this.calcularCambio();
    } else {
      // Si se borra todo, resetear a 0
      this.denominacionRecibida = 0;
      this.calcularCambio();
    }
  }

  async confirmarCierreCuenta(): Promise<void> {
    if (!this.mesaSeleccionadaInfo) return;

    // Obtener el pedidoId directamente de los productos ya cargados (evita llamada lenta al backend)
    const pedidoId = this.mesaSeleccionadaInfo.productos?.[0]?.pedidoId;
    if (!pedidoId) {
      this.toast.error('Error', 'No se encontró un pedido activo para esta mesa');
      return;
    }

    // Validar método de pago efectivo solo si hay denominación ingresada
    if (this.metodoPago === 'efectivo' && this.denominacionRecibida > 0 && this.cambioCalculado < 0) {
      this.toast.error('Error', 'La denominación recibida es insuficiente');
      return;
    }

    // Si no se ha seleccionado ningún producto, cobrar todos
    const productosSeleccionados = Object.values(this.productosCobro).filter(sel => sel);
    if (productosSeleccionados.length === 0) {
      if (this.mesaSeleccionadaInfo.productos) {
        this.mesaSeleccionadaInfo.productos.forEach(producto => {
          const key = producto.detalleId ?? producto.id;
          this.productosCobro[key] = true;
        });
        this.subtotalProductos = this.totalCuenta;
      }
    }

    // Validar que hay productos seleccionados
    if (this.subtotalProductos <= 0) {
      this.toast.error('Error', 'Debes seleccionar al menos un producto para cobrar');
      return;
    }

    try {

      // Preparar productos con cantidades actualizadas
      const productosActualizados = this.mesaSeleccionadaInfo.productos?.map(producto => {
        const key = producto.detalleId ?? producto.id;
        const cantidadCobrada = this.productosCobro[key] ? (this.cantidadesCobro[key] || 0) : 0;
        const cantidadRestante = producto.cantidad - cantidadCobrada;

        return {
          detalleId: producto.detalleId,
          productoId: producto.productoId || producto.id,
          cantidad: cantidadRestante, // Nueva cantidad (restante después del cobro)
          precio: producto.precio,
          precioUnitario: producto.precio
        };
      }) || [];

      console.log('📤 Preparando cobro de pedido...', productosActualizados);

      // Obtener usuario autenticado
      const usuarioActual = this.authService.getUser();
      if (!usuarioActual || !usuarioActual.id) {
        throw new Error('No hay usuario autenticado');
      }

      const cantidadProductosCobrados = this.mesaSeleccionadaInfo.productos?.reduce((sum: number, producto: any) => {
        const key = producto.detalleId ?? producto.id;
        const cantidadCobrada = this.productosCobro[key] ? (this.cantidadesCobro[key] || producto.cantidad || 1) : 0;
        return sum + cantidadCobrada;
      }, 0) || 0;

      const productosSnapshot = (this.mesaSeleccionadaInfo.productos || [])
        .filter((producto: any) => {
          const key = producto.detalleId ?? producto.id;
          return this.productosCobro[key];
        })
        .map((producto: any) => {
          const key = producto.detalleId ?? producto.id;
          const cantidadCobrada = this.cantidadesCobro[key] || producto.cantidad || 1;
          return {
            nombre: producto.nombre,
            cantidad: cantidadCobrada,
            precio: producto.precio,
            subtotal: cantidadCobrada * (producto.precio || 0),
            comentario: producto.comentario || producto.personalizacion || ''
          };
        });

      const payloadCobro = {
        mesa_id: this.mesaSeleccionadaInfo.id,
        usuario_id: usuarioActual.id,
        orden_id: pedidoId,
        total: this.subtotalProductos,
        estado: 'completada',
        metodo_pago: this.metodoPago,
        cantidad_productos: cantidadProductosCobrados,
        productos_json: productosSnapshot,
        productosActualizados: productosActualizados
      };

      console.log('➡️ Enviando requerimiento UNIFICADO a Base de Datos de forma síncrona...');
      const resultado = await this.supabaseService.cobrarMesaCompleta(payloadCobro);
      console.log('✅ Resultado unificado completado:', resultado);

      // Si el pedido se cerró completamente (no quedan productos)
      if (resultado.pedidoCerrado) {
        // NOTA: El backend YA actualizó el estado de la mesa a 'disponible' internamente.
        // No necesitamos hacer la consulta extra. Actualizamos estado del cliente.

        // Actualizar localmente
        const index = this.mesas.findIndex(m => m.id === this.mesaSeleccionadaInfo!.id);
        if (index !== -1) {
          this.mesas[index].estado = 'disponible';
          delete this.mesas[index].tiempoOcupacion;
          delete this.mesas[index].cliente;
          delete this.mesas[index].totalCuenta;
          delete this.mesas[index].productos;
          delete this.mesas[index].horaApertura;
        }

        this.aplicarFiltros();
        this.toast.success('Cuenta cerrada', `Mesa ${this.mesaSeleccionadaInfo.numero} liberada. Total: $${this.formatearMoneda(this.subtotalProductos)}`);
        this.cerrarModalCierreCuenta();
        this.cerrarModalInfoMesa();
      } else {
        // Si quedan productos, actualizar la mesa con los productos restantes
        console.log('📦 Productos restantes en orden:', resultado.pedido?.productos?.length || 0);
        const productosRestantes = this.mapearProductosPedidoDesdeBackend(resultado.pedido?.productos || []);
        this.mesaSeleccionadaInfo.productos = productosRestantes;
        this.mesaSeleccionadaInfo.totalCuenta = resultado.pedido?.total || 0;

        const index = this.mesas.findIndex(m => m.id === this.mesaSeleccionadaInfo!.id);
        if (index !== -1) {
          this.mesas[index] = { ...this.mesaSeleccionadaInfo };
        }

        this.aplicarFiltros();
        this.toast.success('Cobro parcial', `Se cobraron productos por $${this.formatearMoneda(this.subtotalProductos)}. Quedan ${resultado.productosRestantes} productos`);
        this.cerrarModalCierreCuenta();
      }
    } catch (error: any) {
      console.error('Error al cerrar cuenta:', error);
      // Validar si el error viene por caja cerrada manejado en el backend
      if (error && error.message && error.message.includes('caja')) {
         await Swal.fire({
          title: '⚠️ Caja Cerrada',
          html: `<div style="text-align: center;"><div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div><p style="font-size: 1.1rem; color: #495057; margin-bottom: 0.5rem;"><strong>No se puede procesar la venta</strong></p><p style="font-size: 0.9rem; color: #6c757d;">Debe abrir la caja antes de realizar ventas.<br>Dirígete al módulo de <strong>Ventas</strong> para abrir la caja.</p></div>`,
          icon: 'warning',
          confirmButtonColor: '#dc3545',
          confirmButtonText: 'Entendido'
        });
      } else {
        this.toast.error('Error', error.message || 'No se pudo procesar el cierre de cuenta');
      }
    }
  }

  // Métodos para transferir mesa
  async abrirModalTransferirMesa(): Promise<void> {
    if (this.mesaSeleccionadaInfo?.estado === 'ocupado') {
      try {
        const pedidoActivo = await this.supabaseService.obtenerPedidoActivoMesa(this.mesaSeleccionadaInfo.id);
        if (pedidoActivo && Array.isArray(pedidoActivo.items)) {
          this.mesaSeleccionadaInfo.productos = this.mapearProductosPedidoDesdeBackend(pedidoActivo.items);
          this.mesaSeleccionadaInfo.totalCuenta = pedidoActivo.total ?? this.calcularTotalMesa(this.mesaSeleccionadaInfo);
        }
      } catch (error) {
        console.error('Error refrescando pedido antes de transferir:', error);
      }
    }

    this.registerModalOpen('transferir', this.mostrarModalTransferirMesa);
    this.mostrarModalTransferirMesa = true;
    this.mesaDestinoSeleccionada = null;
    this.inicializarSeleccionProductos();
    this.cargarMesasDisponiblesParaTransferencia();
  }

  cerrarModalTransferirMesa(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.removeModalHistoryEntry('transferir');
    }
    this.mostrarModalTransferirMesa = false;
    this.mesaDestinoSeleccionada = null;
    this.productosSeleccionadosTransferencia = [];
  }

  inicializarSeleccionProductos(): void {
    if (this.mesaSeleccionadaInfo?.productos) {
      this.productosSeleccionadosTransferencia = new Array(this.mesaSeleccionadaInfo.productos.length).fill(true);
    }
  }

  toggleProductoTransferencia(index: number): void {
    if (this.productosSeleccionadosTransferencia[index] !== undefined) {
      this.productosSeleccionadosTransferencia[index] = !this.productosSeleccionadosTransferencia[index];
    }
  }

  seleccionarTodosProductos(): void {
    this.productosSeleccionadosTransferencia = this.productosSeleccionadosTransferencia.map(() => true);
  }

  deseleccionarTodosProductos(): void {
    this.productosSeleccionadosTransferencia = this.productosSeleccionadosTransferencia.map(() => false);
  }

  hayProductosSeleccionados(): boolean {
    return this.productosSeleccionadosTransferencia.some(seleccionado => seleccionado);
  }

  calcularTotalProductosSeleccionados(): number {
    if (!this.mesaSeleccionadaInfo?.productos) return 0;

    return this.mesaSeleccionadaInfo.productos
      .filter((_, index) => this.productosSeleccionadosTransferencia[index])
      .reduce((total, producto) => total + producto.subtotal, 0);
  }

  cargarMesasDisponiblesParaTransferencia(): void {
    // Obtener todas las mesas excepto la actual
    this.mesasDisponiblesParaTransferencia = this.mesas.filter(
      mesa => mesa.id !== this.mesaSeleccionadaInfo?.id
    );
  }

  seleccionarMesaDestino(mesaId: string): void {
    this.mesaDestinoSeleccionada = mesaId;
  }

  async confirmarTransferenciaMesa(): Promise<void> {
    if (!this.mesaSeleccionadaInfo || !this.mesaDestinoSeleccionada) {
      return;
    }

    const mesaOrigen = this.mesaSeleccionadaInfo;
    const mesaDestino = this.mesas.find((m) => m.id === this.mesaDestinoSeleccionada);

    if (!mesaDestino) {
      this.toast.error('Error', 'No se encontró la mesa de destino');
      return;
    }

    if (!mesaOrigen.productos || mesaOrigen.productos.length === 0) {
      this.toast.error('Error', 'La mesa de origen no tiene productos para transferir');
      return;
    }

    const productosATransferir = mesaOrigen.productos
      .map((producto, index) => ({ producto, seleccionado: this.productosSeleccionadosTransferencia[index] }))
      .filter(({ seleccionado }) => seleccionado)
      .map(({ producto }) => producto);

    if (productosATransferir.length === 0) {
      this.toast.error('Error', 'Selecciona al menos un producto para transferir');
      return;
    }

    if (productosATransferir.some((p) => !p.detalleId)) {
      this.toast.error('Error', 'Algunos productos no se pueden transferir todavía. Vuelve a abrir la mesa para refrescar el pedido.');
      return;
    }

    const payload = {
      mesaOrigenId: mesaOrigen.id,
      mesaDestinoId: mesaDestino.id,
      usuarioId: 1,
      productos: productosATransferir.map((p) => ({
        detalleId: p.detalleId,
        productoId: p.productoId ?? p.id,
        cantidad: p.cantidad,
        precioUnitario: p.precio,
        subtotal: p.subtotal,
        notas: p.notas ?? null,
        comentario: p.comentario ?? null,
        personalizacion: p.personalizacion ?? null,
        modificadores: p.modificadores ?? [],
      })),
    };

    try {
      const respuesta = await this.supabaseService.transferirProductosMesa(payload);

      const data = respuesta?.data || respuesta;
      const dataDestino = data?.destino;
      const dataOrigen = data?.origen;

      if (dataDestino?.pedido) {
        const productosDestino = this.mapearProductosPedidoDesdeBackend(dataDestino.pedido.items || []);
        mesaDestino.productos = productosDestino;
        mesaDestino.totalCuenta = dataDestino.pedido.total ?? this.calcularTotalMesa(mesaDestino);
        mesaDestino.estado = 'ocupado';
        if (!mesaDestino.horaApertura) {
          mesaDestino.horaApertura = new Date();
        }
        this.actualizarMesaEnColeccion({ ...mesaDestino });
      }

      if (dataOrigen?.pedido) {
        const productosOrigen = this.mapearProductosPedidoDesdeBackend(dataOrigen.pedido.items || []);
        this.mesaSeleccionadaInfo.productos = productosOrigen;
        this.mesaSeleccionadaInfo.totalCuenta = dataOrigen.pedido.total ?? this.calcularTotalMesa(this.mesaSeleccionadaInfo);
        this.mesaSeleccionadaInfo.estado = 'ocupado';
      } else {
        this.mesaSeleccionadaInfo.estado = 'disponible';
        delete this.mesaSeleccionadaInfo.productos;
        delete this.mesaSeleccionadaInfo.totalCuenta;
        delete this.mesaSeleccionadaInfo.tiempoOcupacion;
        delete this.mesaSeleccionadaInfo.horaApertura;
      }

      this.actualizarMesaEnColeccion({ ...this.mesaSeleccionadaInfo });

      this.aplicarFiltros();
      this.toast.success('Transferencia completada', 'Los productos se transfirieron correctamente');

      this.cerrarModalTransferirMesa();
      this.cerrarModalInfoMesa();
    } catch (error) {
      console.error('Error al transferir productos de mesa:', error);
      this.toast.error('Error', 'No se pudo completar la transferencia. Inténtalo nuevamente.');
    }
  }

  // Método para obtener comentarios preestablecidos para un producto
  obtenerComentariosPreestablecidos(producto: ProductoPedido): string[] {
    // Extraer el nombre base del producto (sin modificadores)
    const nombreBase = producto.nombre.split('(')[0].trim();
    const productoEncontrado = this.productos.find(p => p.nombre.trim() === nombreBase);
    let comentarios: string[] = [];

    console.log('🔍 Obteniendo comentarios para:', producto.nombre);
    console.log('🔤 Nombre base extraído:', nombreBase);
    console.log('📦 Producto encontrado:', productoEncontrado);

    // SOLO obtener comentarios si el producto tiene comentarios asignados
    if (productoEncontrado && (productoEncontrado as any).comentarios) {
      const comentariosProducto = (productoEncontrado as any).comentarios;
      console.log('💬 Comentarios asignados al producto:', comentariosProducto);

      if (Array.isArray(comentariosProducto) && comentariosProducto.length > 0) {
        comentarios = comentariosProducto;
        console.log('✅ Usando comentarios del producto:', comentarios);
        return comentarios;
      }
    }

    // Si el producto no tiene comentarios asignados, retornar array vacío
    console.log('⚠️ Producto no tiene comentarios asignados, retornando array vacío');
    return [];
  }

  // Método auxiliar para obtener comentarios por defecto (ya no se usa, pero se mantiene por compatibilidad)
  private obtenerComentariosFallback(): string[] {
    return [
      'Sin azúcar', 'Para llevar', 'Empacar bien', 'Con extra de todo', 'Bien frío',
      'Bien caliente', 'Para niño', 'Sin hielo', 'Con decoración especial', 'Urgente'
    ];
  }

  // Método para seleccionar un comentario preestablecido (puede haber múltiples)
  seleccionarComentarioPreestablecido(item: ProductoPedido, comentario: string): void {
    if (!item.comentariosPreestablecidos) {
      item.comentariosPreestablecidos = [];
    }

    const index = item.comentariosPreestablecidos.indexOf(comentario);
    if (index > -1) {
      // Si ya está seleccionado, lo quitamos
      item.comentariosPreestablecidos.splice(index, 1);
    } else {
      // Si no está, lo agregamos
      item.comentariosPreestablecidos.push(comentario);
    }
  }

  // Revisar si un comentario preestablecido está seleccionado
  comentarioPreestablecidoEstaSeleccionado(item: ProductoPedido, comentario: string): boolean {
    return (item.comentariosPreestablecidos || []).includes(comentario);
  }

  // Método para limpiar comentario personalizado
  limpiarComentarioPersonalizado(item: ProductoPedido): void {
    item.comentarioPersonalizado = '';
  }

  private mapearProductosPedidoDesdeBackend(items: any[]): ProductoPedido[] {
    return (items || []).map((item: any) => {
      // item puede ser un OrdenProducto del backend, que tiene la relación producto
      const nombreBase = item.producto?.nombre ?? item.nombre ?? 'Producto';

      // Parsear modificadores si vienen como string JSON
      let modificadores = item.modificadores ?? [];
      if (typeof modificadores === 'string') {
        try {
          modificadores = JSON.parse(modificadores);
        } catch (e) {
          console.warn('Error parseando modificadores:', e);
          modificadores = [];
        }
      }

      // Parsear comentarios desde el campo comentario del backend
      // El formato puede ser:
      // 1. Array JSON: "[\"En vaso\", \"Extra dulce\"]"
      // 2. Combinado: "En vaso, Extra dulce - Sin azúcar"
      // 3. Solo personalizado: "Sin azúcar"
      let comentariosPreestablecidos: string[] = [];
      let comentarioPersonalizado: string = '';

      if (item.comentario) {
        const comentarioStr = String(item.comentario).trim();

        // Intentar parsear como JSON array
        if (comentarioStr.startsWith('[')) {
          try {
            const parsed = JSON.parse(comentarioStr);
            if (Array.isArray(parsed)) {
              comentariosPreestablecidos = parsed;
            } else {
              comentarioPersonalizado = comentarioStr;
            }
          } catch (e) {
            // Si no es JSON válido, tratarlo como texto plano
            comentarioPersonalizado = comentarioStr;
          }
        } else {
          // Formato combinado: "Comentario1, Comentario2 - Personalizado"
          const partes = comentarioStr.split(' - ');
          if (partes.length === 2) {
            // Hay comentario personalizado
            const preestablecidos = partes[0].split(',').map(c => c.trim()).filter(c => c);
            comentariosPreestablecidos = preestablecidos;
            comentarioPersonalizado = partes[1].trim();
          } else if (partes.length === 1) {
            // Podría ser solo preestablecido o solo personalizado
            // Interpretar como personalizado por defecto
            comentarioPersonalizado = comentarioStr;
          }
        }
      }

      // Usar solo el nombre base del producto, sin agregar modificadores en paréntesis
      // Los modificadores se muestran en los detalles abajo
      const nombreFinal = nombreBase;

      return {
        detalleId: item.detalleId ?? item.detalle_id ?? item.id ?? null,
        pedidoId: item.pedidoId ?? item.pedido_id ?? item.ordenId ?? null,
        productoId: item.productoId ?? item.producto_id ?? item.producto?.id ?? null,
        id: item.productoId ?? item.producto_id ?? item.producto?.id ?? 0,
        nombre: nombreFinal,
        precio: Number(item.precioUnitario ?? item.precio ?? item.precio_unitario ?? 0) || 0,
        cantidad: Number(item.cantidad ?? 0) || 0,
        subtotal: Number(item.subtotal ?? 0) || 0,
        notas: item.notas ?? null,
        comentario: item.comentario ?? null,
        comentariosPreestablecidos: comentariosPreestablecidos,
        comentarioPersonalizado: comentarioPersonalizado,
        personalizacion: item.personalizacion ?? null,
        modificadores: Array.isArray(modificadores) ? modificadores : [],
      };
    });
  }
  private validarGrupoModificador(paso: PasoModificador | undefined): boolean {
    if (!paso || paso.grupoId === '') {
      return true;
    }

    const seleccionados = this.modificadoresSeleccionados[paso.grupoId] || [];
    const min = paso.minSelecciones ?? 0;
    const max = paso.maxSelecciones ?? 0;

    if (max > 0 && seleccionados.length > max) {
      return false;
    }

    if (paso.obligatorio || min > 0) {
      return seleccionados.length >= min;
    }

    return true;
  }

  validarTodosLosModificadores(): boolean {
    if (!this.pasosModificadores || this.pasosModificadores.length === 0) {
      return true;
    }

    return this.pasosModificadores
      .filter(paso => paso.grupoId !== '')
      .every(paso => this.validarGrupoModificador(paso));
  }

  // Método para obtener el nombre base del producto (sin detalles en paréntesis)
  obtenerNombreBaseProducto(nombreCompleto: string): string {
    // Si el nombre tiene paréntesis, solo tomar la parte antes del paréntesis
    const nombreBase = nombreCompleto.split('(')[0].trim();
    return nombreBase;
  }

  // Método para editar un producto existente en el pedido
  editarProductoPedido(item: ProductoPedido, indice: number): void {
    console.log('✏️ Editando producto del pedido:', item);

    // Buscar el producto original
    const nombreBase = this.obtenerNombreBaseProducto(item.nombre);
    const productoOriginal = this.productos.find(p => p.nombre.trim() === nombreBase);

    if (!productoOriginal) {
      this.toast.error('Error', 'No se encontró el producto original');
      return;
    }

    if (!productoOriginal.especial) {
      this.toast.info('Info', 'Este producto no tiene modificadores para editar');
      return;
    }

    // Abrir el modal especial en modo edición
    this.abrirModalEspecial(productoOriginal, item, indice);
  }
}






