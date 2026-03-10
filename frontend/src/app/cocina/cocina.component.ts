import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionsService } from '../services/permissions.service';
import { VentasService } from '../services/ventas.service';
import { ApiService } from '../services/api.service';
import { SocketService } from '../services/socket.service';


interface Orden {
  id: number;
  numeroMesa: number;
  items: ItemOrden[];
  estado: 'pendiente' | 'en_progreso' | 'completado';
  tiempoCreacion: Date;
  tiempoEstimado?: number; // en minutos (opcional, solo si algún producto tiene tiempo definido)
  notas: string;
  usuarioNombre?: string; // Nombre del usuario que hizo el pedido
  enTransicion?: boolean; // Para actualizaciones optimistas
  visibleCocina?: boolean; // Para ocultar de la cocina
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
  private readonly FILTROS_STORAGE_KEY = 'cocina_filtros_estado';

  private timerSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  tiempoActual = new Date();
  private tickCount = 0;

  /** IDs de órdenes ya conocidas para detectar las verdaderamente nuevas */
  private ordenesConocidas = new Set<any>();
  /** true tras la primera carga (evita sonar al entrar a la vista) */
  private primeraCargatermined = false;
  /** Contexto de audio para el beep de notificación */
  private audioCtx: AudioContext | null = null;
  /** Controla visibilidad del botón "Volver arriba" */
  mostrarScrollTop = false;

  constructor(
    private permissions: PermissionsService,
    private ventasService: VentasService,
    private apiService: ApiService,
    private ngZone: NgZone,
    private socketService: SocketService
  ) { }

  ngOnInit() {
    this.cargarFiltrosGuardados();
    this.cargarPedidos();
    this.aplicarFiltros();

    // Actualizar tiempo transcurrido en UI localmente cada segundo
    this.timerSubscription = interval(1000).subscribe(() => {
      this.tiempoActual = new Date();
    });

    // Suscripciones a WebSockets para tiempo real
    this.socketService.listen('ordenCreada').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.ngZone.run(() => this.cargarPedidos());
    });
    this.socketService.listen('ordenActualizada').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.ngZone.run(() => this.cargarPedidos());
    });
    this.socketService.listen('cantidadesOrdenActualizadas').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.ngZone.run(() => this.cargarPedidos());
    });
    this.socketService.listen('ordenesOcultadas').pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.ngZone.run(() => this.cargarPedidos());
    });

    // Fallback de recarga cada 30 segundos en lugar de 3 (ya que tenemos WebSockets)
    this.ngZone.runOutsideAngular(() => {
      this.timerSubscription!.add(interval(30000).subscribe(() => {
        this.ngZone.run(() => {
          this.cargarPedidos();
        });
      }));
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
    if (this.audioCtx) {
      this.audioCtx.close();
    }
  }

  /** Reproduce un doble beep de notificación usando Web Audio API (sin archivos externos) */
  private reproducirSonidoNuevaOrden(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;

      const tocarBeep = (inicioSegundos: number, frecuencia: number, duracion: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frecuencia, ctx.currentTime + inicioSegundos);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + inicioSegundos);
        gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + inicioSegundos + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + inicioSegundos + duracion);

        oscillator.start(ctx.currentTime + inicioSegundos);
        oscillator.stop(ctx.currentTime + inicioSegundos + duracion + 0.05);
      };

      // Doble beep: tono alto (880Hz) + tono medio (660Hz)
      tocarBeep(0, 880, 0.15);  // primer beep
      tocarBeep(0.22, 660, 0.25);  // segundo beep más largo
    } catch (err) {
      // Si el navegador bloquea el audio, ignorar silenciosamente
      console.warn('No se pudo reproducir sonido de notificación:', err);
    }
  }

  /** Muestra u oculta el botón de volver arriba según la posición del scroll */
  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.mostrarScrollTop = el.scrollTop > 200;
  }

  scrollToTop(): void {
    const container = document.querySelector('.cocina-container') as HTMLElement;
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cargarPedidos() {
    this.ventasService.getOrdenes(0, 100, true)
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
                // Preservar estado optimista si está en transición
                if ((ordenExistente as any).enTransicion) {
                  ordenMapeada.estado = ordenExistente.estado;
                  (ordenMapeada as any).enTransicion = true;
                }
                // Preservar estado de productos recientes y detectar nuevos
                this.preservarYDetectarProductosNuevos(ordenExistente, ordenMapeada);
              } else {
                // Nueva orden, marcar todos los productos como recientes
                this.marcarTodosComoRecientes(ordenMapeada);
              }
              return ordenMapeada;
            });

            // Detectar órdenes NUEVAS (no conocidas antes) para reproducir sonido
            if (this.primeraCargatermined) {
              const tieneNueva = nuevasOrdenes.some((o: Orden) => !this.ordenesConocidas.has(o.id));
              if (tieneNueva) {
                this.reproducirSonidoNuevaOrden();
              }
            }

            // Actualizar conjunto de IDs conocidos
            nuevasOrdenes.forEach((o: Orden) => this.ordenesConocidas.add(o.id));
            this.primeraCargatermined = true;

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
    // ✅ El backend Prisma envía 'createdAt' (no 'fecha')
    let tiempoCreacion: Date;
    const fechaRaw = pedido.createdAt || pedido.fecha;
    if (fechaRaw) {
      if (typeof fechaRaw === 'string') {
        tiempoCreacion = new Date(fechaRaw);
      } else if (fechaRaw instanceof Date) {
        tiempoCreacion = fechaRaw;
      } else {
        tiempoCreacion = new Date(fechaRaw);
      }

      // Validar fecha
      if (isNaN(tiempoCreacion.getTime())) {
        console.warn('Fecha inválida recibida:', fechaRaw, 'usando fecha actual');
        tiempoCreacion = new Date();
      }
    } else {
      tiempoCreacion = new Date();
    }

    // Procesar items (el backend puede enviar 'productos' o 'items')
    const itemsSource = pedido.productos || pedido.items;
    const itemsRaw = Array.isArray(itemsSource) ? itemsSource : [];
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
        nombre: item.producto?.nombre || item.nombre || 'Producto sin nombre',
        cantidad: item.cantidad || 0,
        gruposModificadores: gruposModificadores,
        notas: item.notas || '',
        comentario: item.comentario || '',
        esReciente: false, // Inicializar como false, se marcará después
        tiempoMarcadoReciente: undefined,
        tiempoPreparacion: item.producto?.tiempoPreparacion || item.producto?.tiempo_preparacion || item.tiempoPreparacion || undefined,
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

    if (nombreUsuario && nombreUsuario.includes('@')) {
      const partes = nombreUsuario.split('@');
      nombreUsuario = partes[0].trim();
    }

    if (!nombreUsuario || nombreUsuario === '') {
      nombreUsuario = 'Usuario desconocido';
    }

    // Extraer número de mesa (si fue desvinculada por cobro y guardada en notas)
    let numeroMesa = pedido.mesa?.numero || pedido.numeroMesa || pedido.mesa_id || '?';
    let notas = pedido.notas || '';

    const mesaMatch = notas.match(/^\[Mesa\s+([^\]]+)\]\s*(.*)$/i);
    if (mesaMatch) {
      numeroMesa = mesaMatch[1];
      notas = mesaMatch[2].trim();
    }

    // Retornar objeto sin referencias compartidas
    return {
      id: pedido.id,
      numeroMesa: numeroMesa,
      items: [...items], // Copia del array
      estado: this.mapearEstado(pedido.estado),
      tiempoCreacion,
      tiempoEstimado,
      notas: notas,
      usuarioNombre: nombreUsuario,
      visibleCocina: pedido.visibleCocina !== false
    };
  }

  mapearEstado(estado: string): 'pendiente' | 'en_progreso' | 'completado' {
    if (!estado) return 'pendiente';
    const normalized = estado.toLowerCase();

    if (normalized === 'pendiente') return 'pendiente';
    if (normalized === 'en_progreso' || normalized === 'en_curso') return 'en_progreso';
    if (normalized === 'completado' || normalized === 'completada' || normalized === 'entregado') return 'completado';

    return 'pendiente';
  }

  aplicarFiltros() {
    this.ordenesFiltradas = this.ordenes.filter(orden => {
      // Si fue ocultada explicitly de la cocina, no mostrarla
      if (orden.visibleCocina === false) {
        return false;
      }

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

    // Utilizar toggleFiltro para guardar en localStorage y actualizar estado correctamente
    this.toggleFiltro(value);
  }

  cargarFiltrosGuardados() {
    try {
      const guardados = localStorage.getItem(this.FILTROS_STORAGE_KEY);
      if (guardados) {
        this.filtrosEstado = JSON.parse(guardados);
      }
    } catch (e) {
      console.error('Error cargando filtros guardados:', e);
    }
  }

  guardarFiltros() {
    try {
      localStorage.setItem(this.FILTROS_STORAGE_KEY, JSON.stringify(this.filtrosEstado));
    } catch (e) {
      console.error('Error guardando filtros:', e);
    }
  }

  toggleFiltro(estado: string) {
    if (estado === 'todos') {
      this.filtrosEstado = ['todos'];
    } else {
      // Si estaba en 'todos', lo quitamos
      this.filtrosEstado = this.filtrosEstado.filter(f => f !== 'todos');

      const index = this.filtrosEstado.indexOf(estado);
      if (index === -1) {
        this.filtrosEstado.push(estado);
      } else {
        this.filtrosEstado.splice(index, 1);
      }

      // Si no queda ningún filtro, volvemos a 'todos'
      if (this.filtrosEstado.length === 0) {
        this.filtrosEstado = ['todos'];
      }
    }

    this.guardarFiltros();
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

    const estadoAnterior = orden.estado;
    // Actualización optimista inmediata
    orden.estado = nuevoEstado;
    orden.enTransicion = true;
    this.aplicarFiltros();

    this.apiService.actualizarEstadoPedido(orden.id, nuevoEstado).subscribe({
      next: (response: any) => {
        orden.enTransicion = false;
        if (!response.success) {
          orden.estado = estadoAnterior;
          this.aplicarFiltros();
        }
      },
      error: (error: any) => {
        console.error('Error actualizando estado:', error);
        orden.enTransicion = false;
        orden.estado = estadoAnterior;
        this.aplicarFiltros();
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

  /* limpiarFiltros original eliminado por el nuevo comportamiento con localStorage */

  getOrdenesPendientes(): number {
    return this.ordenes.filter(orden => orden.estado === 'pendiente').length;
  }

  getOrdenesEnPreparacion(): number {
    return this.ordenes.filter(orden => orden.estado === 'en_progreso').length;
  }

  getOrdenesCompletadas(): number {
    return this.ordenes.filter(orden => orden.estado === 'completado').length;
  }

  limpiarFiltros() {
    this.filtrosEstado = ['todos'];
    this.guardarFiltros();
    this.aplicarFiltros();
  }

  trackByOrden(index: number, orden: Orden): number {
    return orden.id;
  }
}
