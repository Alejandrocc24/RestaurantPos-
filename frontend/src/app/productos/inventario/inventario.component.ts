import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { firstValueFrom } from 'rxjs';

interface InventarioItem {
  id?: number;
  producto_id: number;
  producto_nombre?: string;
  producto_codigo?: string;
  cantidad_actual: number;
  cantidad_minima: number;
  unidad_medida: string;
  ubicacion?: string;
  fecha_ultima_actualizacion?: string;
  notas?: string;
}

interface MovimientoInventario {
  id?: number;
  inventario_id: number;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'venta';
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo?: string;
  referencia?: string;
  fecha_movimiento?: string;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit, OnDestroy {
  inventario: InventarioItem[] = [];
  inventarioFiltrado: InventarioItem[] = [];
  productos: any[] = [];
  
  // Filtros
  terminoBusqueda = '';
  mostrarBajoStock = false;
  categoriaFiltro = 'Todas';
  categorias: string[] = ['Todas'];
  
  // Modal de movimiento
  mostrarModalMovimiento = false;
  movimientoActual: MovimientoInventario = {
    inventario_id: 0,
    tipo_movimiento: 'entrada',
    cantidad: 0,
    cantidad_anterior: 0,
    cantidad_nueva: 0,
    motivo: ''
  };
  itemSeleccionado: InventarioItem | null = null;
  
  // Modal de edición
  mostrarModalEdicion = false;
  itemEditando: InventarioItem | null = null;
  
  cargando = false;
  
  @Output() viewChangeRequested = new EventEmitter<string>();
  
  constructor(
    private supabaseService: SupabaseService,
    private apiService: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    try {
      await Promise.all([
        this.cargarInventario(),
        this.cargarProductos(),
        this.cargarCategorias()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.toast.error('Error', 'No se pudieron cargar los datos del inventario');
    } finally {
      this.cargando = false;
    }
  }

  async cargarInventario(): Promise<void> {
    try {
      const resp = await firstValueFrom(this.apiService.getData('inventario'));
      const data = resp?.data || resp || [];
      this.inventario = (Array.isArray(data) ? data : []).map((item: any) => ({
        ...item,
        cantidad_actual: Number(item.cantidad_actual) || 0,
        cantidad_minima: Number(item.cantidad_minima) || 0
      }));
      this.filtrarInventario();
    } catch (error) {
      console.warn('Endpoint /api/inventario no disponible, usando datos de productos como base');
      // Si el endpoint no existe, usar productos como base de inventario
      this.inventario = [];
      this.filtrarInventario();
    }
  }

  async cargarProductos(): Promise<void> {
    try {
      this.productos = await this.supabaseService.getProductos();
      // Enriquecer inventario con datos de productos
      this.inventario = this.inventario.map(item => {
        const producto = this.productos.find(p => p.id === item.producto_id);
        return {
          ...item,
          producto_nombre: producto?.nombre || 'Producto no encontrado',
          producto_codigo: producto?.codigo || ''
        };
      });
      this.filtrarInventario();
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }

  async cargarCategorias(): Promise<void> {
    try {
      const categorias = await this.supabaseService.getCategorias();
      this.categorias = ['Todas', ...(categorias || []).map((c: any) => c.nombre)];
    } catch (error) {
      console.error('Error cargando categorías:', error);
      this.categorias = ['Todas'];
    }
  }

  filtrarInventario(): void {
    let filtrado = [...this.inventario];

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      filtrado = filtrado.filter(item =>
        item.producto_nombre?.toLowerCase().includes(termino) ||
        item.producto_codigo?.toLowerCase().includes(termino) ||
        item.ubicacion?.toLowerCase().includes(termino)
      );
    }

    // Filtrar por bajo stock
    if (this.mostrarBajoStock) {
      filtrado = filtrado.filter(item => item.cantidad_actual <= item.cantidad_minima);
    }

    // Filtrar por categoría
    if (this.categoriaFiltro !== 'Todas') {
      filtrado = filtrado.filter(item => {
        const producto = this.productos.find(p => p.id === item.producto_id);
        return producto?.categoria === this.categoriaFiltro;
      });
    }

    this.inventarioFiltrado = filtrado;
  }

  obtenerEstadoStock(item: InventarioItem): 'bajo' | 'normal' | 'sin-stock' {
    if (item.cantidad_actual === 0) return 'sin-stock';
    if (item.cantidad_actual <= item.cantidad_minima) return 'bajo';
    return 'normal';
  }

  abrirModalMovimiento(item: InventarioItem): void {
    this.itemSeleccionado = item;
    this.movimientoActual = {
      inventario_id: item.id || 0,
      tipo_movimiento: 'entrada',
      cantidad: 0,
      cantidad_anterior: item.cantidad_actual,
      cantidad_nueva: item.cantidad_actual,
      motivo: ''
    };
    this.mostrarModalMovimiento = true;
  }

  cerrarModalMovimiento(): void {
    this.mostrarModalMovimiento = false;
    this.itemSeleccionado = null;
    this.movimientoActual = {
      inventario_id: 0,
      tipo_movimiento: 'entrada',
      cantidad: 0,
      cantidad_anterior: 0,
      cantidad_nueva: 0,
      motivo: ''
    };
  }

  calcularCantidadNueva(): void {
    const cantidad = Number(this.movimientoActual.cantidad) || 0;
    const anterior = this.movimientoActual.cantidad_anterior;

    if (this.movimientoActual.tipo_movimiento === 'entrada' || this.movimientoActual.tipo_movimiento === 'ajuste') {
      this.movimientoActual.cantidad_nueva = anterior + cantidad;
    } else if (this.movimientoActual.tipo_movimiento === 'salida' || this.movimientoActual.tipo_movimiento === 'venta') {
      this.movimientoActual.cantidad_nueva = Math.max(0, anterior - cantidad);
    }
  }

  async guardarMovimiento(): Promise<void> {
    if (!this.itemSeleccionado) return;

    if (this.movimientoActual.cantidad <= 0) {
      this.toast.error('Error', 'La cantidad debe ser mayor a 0');
      return;
    }

    if (!this.movimientoActual.motivo?.trim()) {
      this.toast.error('Error', 'Debe ingresar un motivo para el movimiento');
      return;
    }

    try {
      // Actualizar inventario
      const inventarioActualizado = {
        cantidad_actual: this.movimientoActual.cantidad_nueva,
        fecha_ultima_actualizacion: new Date().toISOString()
      };

      await firstValueFrom(this.apiService.updateData('inventario', 
        { id: this.itemSeleccionado.id },
        inventarioActualizado
      ));

      // Registrar movimiento
      const movimientoData = {
        ...this.movimientoActual,
        fecha_movimiento: new Date().toISOString()
      };

      await firstValueFrom(this.apiService.insertData('movimientos_inventario', movimientoData));

      this.toast.success('Movimiento registrado', 'El movimiento de inventario se registró correctamente');
      this.cerrarModalMovimiento();
      await this.cargarInventario();
    } catch (error) {
      console.error('Error guardando movimiento:', error);
      this.toast.error('Error', 'No se pudo registrar el movimiento');
    }
  }

  abrirModalEdicion(item: InventarioItem): void {
    this.itemEditando = { ...item };
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.itemEditando = null;
  }

  async guardarEdicion(): Promise<void> {
    if (!this.itemEditando) return;

    try {
      if (this.itemEditando.id) {
        // Actualizar
        await firstValueFrom(this.apiService.updateData('inventario',
          { id: this.itemEditando.id },
          {
            cantidad_minima: Number(this.itemEditando.cantidad_minima) || 0,
            unidad_medida: this.itemEditando.unidad_medida || 'unidad',
            ubicacion: this.itemEditando.ubicacion || null,
            notas: this.itemEditando.notas || null
          }
        ));
        this.toast.success('Actualizado', 'El inventario se actualizó correctamente');
      } else {
        // Crear nuevo registro
        await firstValueFrom(this.apiService.insertData('inventario', {
          producto_id: this.itemEditando.producto_id,
          cantidad_actual: Number(this.itemEditando.cantidad_actual) || 0,
          cantidad_minima: Number(this.itemEditando.cantidad_minima) || 0,
          unidad_medida: this.itemEditando.unidad_medida || 'unidad',
          ubicacion: this.itemEditando.ubicacion || null,
          notas: this.itemEditando.notas || null
        }));
        this.toast.success('Creado', 'El registro de inventario se creó correctamente');
      }

      this.cerrarModalEdicion();
      await this.cargarInventario();
    } catch (error) {
      console.error('Error guardando inventario:', error);
      this.toast.error('Error', 'No se pudo guardar el inventario');
    }
  }

  async crearInventarioParaProducto(productoId: number): Promise<void> {
    try {
      // Verificar si ya existe
      const existente = this.inventario.find(item => item.producto_id === productoId);
      if (existente) {
        this.toast.warning('Atención', 'Este producto ya tiene un registro de inventario');
        return;
      }

      this.itemEditando = {
        producto_id: productoId,
        cantidad_actual: 0,
        cantidad_minima: 0,
        unidad_medida: 'unidad',
        ubicacion: ''
      };

      const producto = this.productos.find(p => p.id === productoId);
      if (producto) {
        this.itemEditando.producto_nombre = producto.nombre;
        this.itemEditando.producto_codigo = producto.codigo;
      }

      this.mostrarModalEdicion = true;
    } catch (error) {
      console.error('Error creando inventario:', error);
      this.toast.error('Error', 'No se pudo crear el registro de inventario');
    }
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

  navegarAGestionComentarios(): void {
    this.viewChangeRequested.emit('gestion-comentarios');
  }
}

