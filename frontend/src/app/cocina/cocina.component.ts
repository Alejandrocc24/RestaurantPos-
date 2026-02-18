import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionsService } from '../services/permissions.service';
import { VentasService } from '../services/ventas.service';
import { ApiService } from '../services/api.service';

interface Orden {
  id: number;
  numeroMesa: number;
  items: ItemOrden[];
  estado: 'pendiente' | 'en_progreso' | 'completado';
  tiempoCreacion: Date;
  tiempoEstimado?: number; // en minutos (opcional, solo si algún producto tiene tiempo definido)
  notas: string;
  usuarioNombre?: string; // Nombre del usuario que hizo el pedido
}

interface GrupoModificador {
  grupoNombre: string;
  modificadores: string[];
}

interface ItemOrden {
  id: number;
  nombre: string;
  cantidad: number;
  gruposModificadores: GrupoModificador[];
  notas: string;
  comentario?: string;
  esReciente?: boolean; // Para mostrar badge de nuevo
  tiempoMarcadoReciente?: Date; // Timestamp de cuando se marcó como reciente
  tiempoPreparacion?: number; // Tiempo de preparación en minutos
  tiempoCreacionItem?: Date; // Tiempo de creación del item para calcular tiempo transcurrido
}

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaComponent implements OnInit, OnDestroy {
  ordenes: Orden[] = [];
  ordenesFiltradas: Orden[] = [];
  filtrosEstado: string[] = ['todos'];

  private timerSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  tiempoActual = new Date();
  private tickCount = 0;

  constructor(
    private permissions: PermissionsService,
    private ventasService: VentasService,
    private apiService: ApiService,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.cargarPedidos();
    this.aplicarFiltros();

    // Actualizar tiempo cada segundo y recargar pedidos cada 1 segundo
    this.ngZone.runOutsideAngular(() => {
      this.timerSubscription = interval(1000).subscribe((count) => {
        this.ngZone.run(() => {
          // Recargar pedidos cada 1 segundo para aparición instantánea
          this.cargarPedidos();
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPedidos() {
    this.ventasService.getOrdenes(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ordenes: any) => {
          if (ordenes && Array.isArray(ordenes)) {
            // ✅ Preservar tiempoCreacion de órdenes existentes para evitar reinicio del tiempo
            const ordenesExistentesMap = new Map<number, Orden>();
            this.ordenes.forEach(orden => {
              ordenesExistentesMap.set(orden.id, orden);
            });

            // Mapear nuevas órdenes
            const nuevasOrdenes = ordenes.map((pedido: any) => {
              const ordenMapeada = this.mapearPedidoAOrden(pedido);
              // Si la orden ya existe, preservar su tiempoCreacion original
              const ordenExistente = ordenesExistentesMap.get(ordenMapeada.id);
              if (ordenExistente && ordenExistente.tiempoCreacion instanceof Date) {
                ordenMapeada.tiempoCreacion = ordenExistente.tiempoCreacion;
                // Preservar estado de productos recientes y detectar nuevos
                this.preservarYDetectarProductosNuevos(ordenExistente, ordenMapeada);
              } else {
                // Nueva orden, marcar todos los productos como recientes
                this.marcarTodosComoRecientes(ordenMapeada);
              }
              return ordenMapeada;
            });

            this.ordenes = nuevasOrdenes;
            this.aplicarFiltros();
          }
        },
        error: (error: any) => {
          console.error('Error cargando pedidos:', error);
        }
      });
  }

  mapearPedidoAOrden(pedido: any): Orden {
    // ✅ El backend envía 'fecha', no 'tiempoCreacion'
    let tiempoCreacion: Date;
    if (pedido.fecha) {
      if (typeof pedido.fecha === 'string') {
        // Siempre interpretar como ISO string (UTC)
        tiempoCreacion = new Date(pedido.fecha);
      } else if (pedido.fecha instanceof Date) {
        tiempoCreacion = pedido.fecha;
      } else {
        tiempoCreacion = new Date(pedido.fecha);
      }

      // Validar fecha
      if (isNaN(tiempoCreacion.getTime())) {
        console.warn('Fecha inválida recibida:', pedido.fecha, 'usando fecha actual');
        tiempoCreacion = new Date();
      }
    } else {
      tiempoCreacion = new Date();
    }

    // Procesar items
    const itemsRaw = Array.isArray(pedido.items) ? pedido.items : [];
    const items: ItemOrden[] = itemsRaw.map((item: any) => {
      // Procesar modificadores - estructura: [{grupoId, grupoNombre, modificadores: [{nombre, precio}]}]
      let gruposModificadores: GrupoModificador[] = [];

      if (Array.isArray(item.modificadores)) {
        item.modificadores.forEach((grupo: any) => {
          if (typeof grupo === 'string') {
            // Si es string directo, crear un grupo genérico
            gruposModificadores.push({
              grupoNombre: 'Modificadores',
              modificadores: [grupo]
            });
          } else if (grupo && typeof grupo === 'object') {
            // Si tiene la propiedad 'modificadores' (array anidado)
            if (Array.isArray(grupo.modificadores) && grupo.modificadores.length > 0) {
              const modificadoresDelGrupo = grupo.modificadores
                .filter((mod: any) => mod && (mod.nombre || typeof mod === 'string'))
                .map((mod: any) => typeof mod === 'string' ? mod : mod.nombre);

              if (modificadoresDelGrupo.length > 0) {
                gruposModificadores.push({
                  grupoNombre: grupo.grupoNombre || 'Modificadores',
                  modificadores: modificadoresDelGrupo
                });
              }
            }
            // Si tiene la propiedad 'nombre' directamente
            else if (grupo.nombre) {
              gruposModificadores.push({
                grupoNombre: 'Modificadores',
                modificadores: [grupo.nombre]
              });
            }
          }
        });
      }

      return {
        id: item.id || item.productoId,
        nombre: item.nombre || 'Producto sin nombre',
        cantidad: item.cantidad || 0,
        gruposModificadores: gruposModificadores,
        notas: item.notas || '',
        comentario: item.comentario || '',
        esReciente: false, // Inicializar como false, se marcará después
        tiempoMarcadoReciente: undefined,
        tiempoPreparacion: item.tiempoPreparacion || item.producto?.tiempo_preparacion || item.producto?.tiempoPreparacion || undefined,
        tiempoCreacionItem: item.tiempoCreacion ? new Date(item.tiempoCreacion) : tiempoCreacion
      };
    });

    // Calcular tiempo estimado: usar el tiempo máximo de preparación de los productos
    // Si ningún producto tiene tiempo definido, no mostrar tiempo estimado
    const tiemposPreparacion = items
      .map(item => item.tiempoPreparacion)
      .filter(tiempo => tiempo !== undefined && tiempo !== null && tiempo > 0) as number[];

    let tiempoEstimado: number | undefined;
    if (tiemposPreparacion.length > 0) {
      // Usar el tiempo máximo de preparación (el producto que más tarda)
      // Esto asegura que el tiempo estimado sea suficiente para preparar todos los productos
      tiempoEstimado = Math.max(...tiemposPreparacion);
    } else {
      // Si no hay tiempos definidos, no mostrar tiempo estimado
      tiempoEstimado = undefined;
    }

    // Limpiar el nombre de usuario (remover @dulcemomento o cualquier @dominio)
    let nombreUsuario = pedido.usuario?.nombre || pedido.usuarioNombre || 'Usuario desconocido';

    // Si el nombre contiene @ seguido de texto, extraer solo la parte antes del @
    if (nombreUsuario && nombreUsuario.includes('@')) {
      const partes = nombreUsuario.split('@');
      nombreUsuario = partes[0].trim();
    }

    // Si después de limpiar está vacío, usar fallback
    if (!nombreUsuario || nombreUsuario === '') {
      nombreUsuario = 'Usuario desconocido';
    }

    // Retornar objeto sin referencias compartidas
    return {
      id: pedido.id,
      numeroMesa: pedido.numeroMesa || pedido.mesa_id,
      items: [...items], // Copia del array
      estado: this.mapearEstado(pedido.estado),
      tiempoCreacion,
      tiempoEstimado,
      notas: pedido.notas || '',
      usuarioNombre: nombreUsuario
    };
  }

  mapearEstado(estado: string): 'pendiente' | 'en_progreso' | 'completado' {
    if (estado === 'pendiente') return 'pendiente';
    if (estado === 'en_progreso') return 'en_progreso';
    // 'cerrado' NO debe mapearse a 'completado' - el estado del pedido es independiente del estado de la mesa
    if (estado === 'completado' || estado === 'entregado') return 'completado';
    // Si el estado es 'cerrado' o cualquier otro, mantener el estado original si es válido, sino 'pendiente'
    if (estado === 'cerrado') return 'pendiente'; // Mantener como pendiente si está cerrado (no completado)
    return 'pendiente';
  }

  aplicarFiltros() {
    this.ordenesFiltradas = this.ordenes.filter(orden => {
      if (this.filtrosEstado.includes('todos')) {
        return true;
      }
      return this.filtrosEstado.includes(orden.estado);
    });

    // Ordenar automáticamente por tiempo de llegada (más antiguas primero)
    this.ordenesFiltradas.sort((a, b) => {
      // Validar que tiempoCreacion es un Date válido
      const tiempoA = a.tiempoCreacion instanceof Date ? a.tiempoCreacion.getTime() : 0;
      const tiempoB = b.tiempoCreacion instanceof Date ? b.tiempoCreacion.getTime() : 0;
      return tiempoA - tiempoB;
    });
  }

  cambiarFiltro(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!value) { return; }

    // Si seleccionan 'todos', ignorar los otros y poner solo 'todos'
    if (value === 'todos') {
      if (input.checked) {
        this.filtrosEstado = ['todos'];
      } else {
        // desmarcar 'todos' => mostrar todos por defecto
        this.filtrosEstado = ['todos'];
      }
      this.aplicarFiltros();
      return;
    }

    // Si 'todos' está activo, removerlo antes de trabajar con individuales
    if (this.filtrosEstado.includes('todos')) {
      this.filtrosEstado = [];
    }

    if (input.checked) {
      if (!this.filtrosEstado.includes(value)) {
        this.filtrosEstado.push(value);
      }
    } else {
      this.filtrosEstado = this.filtrosEstado.filter(f => f !== value);
      if (this.filtrosEstado.length === 0) {
        this.filtrosEstado = ['todos'];
      }
    }

    this.aplicarFiltros();
  }

  cambiarEstado(orden: Orden, nuevoEstado: 'pendiente' | 'en_progreso' | 'completado') {
    // Verificar permisos según el estado
    if (nuevoEstado === 'en_progreso' && !this.permissions.hasPermission('cocina.preparar')) {
      console.warn('No tienes permiso para iniciar preparación');
      return;
    }
    if (nuevoEstado === 'completado' && !this.permissions.hasPermission('cocina.completar')) {
      console.warn('No tienes permiso para completar pedido');
      return;
    }

    this.apiService.actualizarEstadoPedido(orden.id, nuevoEstado).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Actualizar estado localmente
          orden.estado = nuevoEstado;
          // No limpiar productos recientes al completar, se limpiarán por tiempo
          this.aplicarFiltros();
        }
      },
      error: (error: any) => {
        console.error('Error actualizando estado:', error);
      }
    });
  }

  // Métodos para verificar permisos en el template
  puedePreparar(): boolean {
    return this.permissions.hasPermission('cocina.preparar');
  }

  puedeCompletar(): boolean {
    return this.permissions.hasPermission('cocina.completar');
  }

  // Métodos para mostrar badge de productos nuevos
  preservarYDetectarProductosNuevos(ordenAnterior: Orden, ordenNueva: Orden) {
    // Crear un mapa de items anteriores con su estado de reciente
    const itemsAnterioresMap = new Map<number, ItemOrden>();
    ordenAnterior.items.forEach(item => {
      itemsAnterioresMap.set(item.id, item);
    });

    // Preservar estado de productos existentes y detectar nuevos
    ordenNueva.items.forEach(item => {
      const itemAnterior = itemsAnterioresMap.get(item.id);
      if (itemAnterior) {
        // Preservar estado de reciente, timestamp y tiempo de creación
        item.esReciente = itemAnterior.esReciente;
        item.tiempoMarcadoReciente = itemAnterior.tiempoMarcadoReciente;
        item.tiempoCreacionItem = itemAnterior.tiempoCreacionItem;
      } else {
        // Es un producto nuevo, marcarlo como reciente con timestamp
        item.esReciente = true;
        item.tiempoMarcadoReciente = new Date();
        item.tiempoCreacionItem = new Date();
        console.log(`🆕 Producto nuevo agregado a orden ${ordenNueva.id}:`, { id: item.id, nombre: item.nombre });
      }
    });
  }

  marcarTodosComoRecientes(orden: Orden) {
    // Para nuevas órdenes, no marcar productos como recientes
    // Solo se muestra badge cuando se agregan productos a órdenes existentes
    orden.items.forEach(item => {
      item.esReciente = false;
      item.tiempoMarcadoReciente = undefined;
    });
  }


  obtenerTiempoTranscurrido(orden: Orden): string {
    // Asegurar que tiempoCreacion sea Date
    let tiempoCreacion = orden.tiempoCreacion;
    if (!(tiempoCreacion instanceof Date)) {
      tiempoCreacion = new Date((orden as any).tiempoCreacion);
    }

    const ahora = new Date(); // Siempre usar fecha actual del navegador
    const diferencia = ahora.getTime() - tiempoCreacion.getTime();


    if (isNaN(diferencia) || diferencia < 0) {
      return '0s';
    }

    const totalSegundos = Math.floor(diferencia / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    // Si hay horas, mostrar formato HH:MM:SS
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    }

    // Si hay minutos, mostrar formato MM:SS
    if (minutos > 0) {
      return `${minutos}:${segundos.toString().padStart(2, '0')}`;
    }

    // Si solo hay segundos, mostrar SS
    return `${segundos}s`;
  }

  obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'pendiente': return '#ff4444';
      case 'en_progreso': return '#ffaa00';
      case 'completado': return '#44aa44';
      default: return '#666666';
    }
  }

  obtenerTiempoTranscurridoItem(item: ItemOrden, orden: Orden): number {
    // Usar tiempoCreacionItem si existe, sino usar tiempoCreacion de la orden
    const tiempoInicio = item.tiempoCreacionItem || orden.tiempoCreacion;
    const ahora = new Date();
    const diferencia = ahora.getTime() - tiempoInicio.getTime();
    return Math.floor(diferencia / 1000 / 60); // Retornar en minutos
  }

  obtenerColorTiempoPreparacion(item: ItemOrden, orden: Orden): string {
    if (!item.tiempoPreparacion || item.tiempoPreparacion <= 0) {
      return '#666666'; // Gris si no hay tiempo definido
    }

    const tiempoTranscurrido = this.obtenerTiempoTranscurridoItem(item, orden);
    const tiempoPreparacion = item.tiempoPreparacion;
    const porcentaje = (tiempoTranscurrido / tiempoPreparacion) * 100;

    // Verde: 0-50% del tiempo
    if (porcentaje <= 50) {
      return '#4caf50'; // Verde
    }
    // Naranja: 50-100% del tiempo
    else if (porcentaje <= 100) {
      return '#ff9800'; // Naranja
    }
    // Rojo: más del 100% del tiempo
    else {
      return '#ff4444'; // Rojo
    }
  }

  obtenerTiempoPreparacionFormateado(item: ItemOrden): string {
    if (!item.tiempoPreparacion || item.tiempoPreparacion <= 0) {
      return 'N/A';
    }
    return `${item.tiempoPreparacion} min`;
  }

  obtenerColorTiempoEstimado(orden: Orden): string {
    if (!orden.tiempoEstimado || orden.tiempoEstimado <= 0) {
      return '#666666'; // Gris si no hay tiempo definido
    }

    // Calcular tiempo transcurrido en minutos
    let tiempoCreacion = orden.tiempoCreacion;
    if (!(tiempoCreacion instanceof Date)) {
      tiempoCreacion = new Date((orden as any).tiempoCreacion);
    }

    const ahora = new Date();
    const diferencia = ahora.getTime() - tiempoCreacion.getTime();
    const tiempoTranscurridoMinutos = Math.floor(diferencia / 1000 / 60);
    const tiempoEstimado = orden.tiempoEstimado;
    const porcentaje = (tiempoTranscurridoMinutos / tiempoEstimado) * 100;

    // Verde: 0-50% del tiempo
    if (porcentaje <= 50) {
      return '#4caf50'; // Verde
    }
    // Naranja: 50-100% del tiempo
    else if (porcentaje <= 100) {
      return '#ff9800'; // Naranja
    }
    // Rojo: más del 100% del tiempo
    else {
      return '#ff4444'; // Rojo
    }
  }

  limpiarCompletadas() {
    const completadas = this.ordenes.filter(orden => orden.estado === 'completado');

    if (completadas.length === 0) {
      return;
    }

    const ids = completadas.map(o => o.id);

    this.apiService.ocultarPedidosCocina(ids).subscribe({
      next: () => {
        // Remover de la lista local inmediatamente
        this.ordenes = this.ordenes.filter(orden => orden.estado !== 'completado');
        this.aplicarFiltros();
        // Esperar un momento para que el backend actualice visible_en_cocina
        // El refresh automático (cada 30 segundos) actualizará desde el servidor
        setTimeout(() => {
          this.cargarPedidos();
        }, 1000);
      },
      error: (err: any) => {
        console.error('Error limpiando completadas:', err);
      }
    });
  }

  limpiarFiltros() {
    this.filtrosEstado = ['todos'];
    this.aplicarFiltros();
  }

  getOrdenesPendientes(): number {
    return this.ordenes.filter(orden => orden.estado === 'pendiente').length;
  }

  getOrdenesEnPreparacion(): number {
    return this.ordenes.filter(orden => orden.estado === 'en_progreso').length;
  }

  getOrdenesCompletadas(): number {
    return this.ordenes.filter(orden => orden.estado === 'completado').length;
  }

  scrollToTop(): void {
    const container = document.querySelector('.cocina-container');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }
}
