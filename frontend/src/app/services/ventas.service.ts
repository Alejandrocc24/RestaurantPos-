import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Orden, ApiResponse } from '../types/api.models';

export interface RecaudoDiaActual {
  recaudoActual: number;
  ventasHoy: number;
  promedioTicket: number;
  fecha: string;
  pagosEfectivo: number;
  pagosTransferencia: number;
  pagosTarjeta: number;
}

export interface EstadisticaProducto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  categoria: string;
}

export interface Caja {
  id: string;
  estado: 'abierta' | 'cerrada';
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  montoFinal?: number;
  usuarioApertura: string;
  usuarioCierre?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  constructor(private apiService: ApiService) { }

  /**
   * Obtener todas las órdenes (ventas) con paginación
   */
  getOrdenes(skip: number = 0, take: number = 50, soloActivos?: boolean): Observable<Orden[]> {
    return this.apiService.getOrdenes(skip, take, soloActivos).pipe(
      map((response: ApiResponse<Orden[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Obtener orden por ID
   */
  getOrdenById(id: string): Observable<Orden | null> {
    return this.apiService.getOrdenById(id).pipe(
      map((response: ApiResponse<Orden>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Obtener órdenes activas de una mesa
   */
  getOrdenPorMesa(mesaId: string): Observable<Orden | null> {
    return this.apiService.getPedidoActivoMesa(mesaId).pipe(
      map((response: ApiResponse<Orden>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Obtener todas las órdenes de una mesa
   */
  getOrdenesPorMesa(mesaId: string): Observable<Orden[]> {
    return this.apiService.getOrdenesPorMesa(mesaId).pipe(
      map((response: ApiResponse<Orden[]>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Crear nueva orden
   */
  createOrden(data: Partial<Orden>): Observable<Orden | null> {
    return this.apiService.createOrden(data).pipe(
      map((response: ApiResponse<Orden>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Actualizar orden
   */
  updateOrden(id: string, data: Partial<Orden>): Observable<Orden | null> {
    return this.apiService.updateOrden(id, data).pipe(
      map((response: ApiResponse<Orden>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Cerrar orden
   */
  cerrarOrden(id: string): Observable<Orden | null> {
    return this.apiService.cerrarOrden(id).pipe(
      map((response: ApiResponse<Orden>) => {
        if (response.success && response.data) {
          return response.data;
        }
        return null;
      })
    );
  }

  /**
   * Eliminar orden
   */
  deleteOrden(id: string): Observable<boolean> {
    return this.apiService.deleteOrden(id).pipe(
      map((response: ApiResponse<void>) => response.success)
    );
  }

  /**
   * Obtener órdenes cerradas (para reportes)
   */
  getOrdenesCerradas(): Observable<Orden[]> {
    return this.getOrdenes().pipe(
      map(ordenes => ordenes.filter(o => o.estado === 'completada'))
    );
  }

  /**
   * Obtener órdenes activas
   */
  getOrdenesActivas(): Observable<Orden[]> {
    return this.getOrdenes().pipe(
      map(ordenes => ordenes.filter(o => o.estado === 'pendiente' || o.estado === 'en-curso'))
    );
  }

  /**
   * Obtener recaudo estimado del día (basado en órdenes completadas)
   */
  getRecaudoDiaActual(): Observable<RecaudoDiaActual> {
    return this.getOrdenesCerradas().pipe(
      map(ordenes => {
        const totalRecaudado = ordenes.reduce((sum, orden) => sum + (orden.total || 0), 0);
        const cantidadVentas = ordenes.length;
        const promedioTicket = cantidadVentas > 0 ? totalRecaudado / cantidadVentas : 0;

        return {
          recaudoActual: totalRecaudado,
          ventasHoy: cantidadVentas,
          promedioTicket: promedioTicket,
          fecha: new Date().toISOString().split('T')[0],
          pagosEfectivo: totalRecaudado * 0.6, // Estimado
          pagosTransferencia: totalRecaudado * 0.25, // Estimado
          pagosTarjeta: totalRecaudado * 0.15 // Estimado
        };
      })
    );
  }

  /**
   * Obtener resumen de ventas por período (método heredado para compatibilidad)
   */
  getResumenVentas(fechaInicio: string, fechaFin: string): Observable<{
    totalVentas: number;
    totalRecaudado: number;
    promedioTicket: number;
    mesasCerradas: number;
    productosVendidos: number;
  }> {
    return this.getOrdenesCerradas().pipe(
      map(ordenes => {
        const totalRecaudado = ordenes.reduce((sum, orden) => sum + (orden.total || 0), 0);
        const productosVendidos = ordenes.reduce((sum, orden) =>
          sum + (orden.productos?.reduce((s, p) => s + p.cantidad, 0) || 0), 0
        );
        const promedioTicket = ordenes.length > 0 ? totalRecaudado / ordenes.length : 0;

        return {
          totalVentas: ordenes.length,
          totalRecaudado: totalRecaudado,
          promedioTicket: promedioTicket,
          mesasCerradas: ordenes.length,
          productosVendidos: productosVendidos
        };
      })
    );
  }

  /**
   * Obtener estadísticas de productos vendidos (método heredado para compatibilidad)
   */
  getEstadisticasProductos(): Observable<EstadisticaProducto[]> {
    return this.getOrdenesCerradas().pipe(
      map(ordenes => {
        const productos: Map<string, EstadisticaProducto> = new Map();

        ordenes.forEach(orden => {
          orden.productos?.forEach(producto => {
            const key = producto.productoId;
            if (productos.has(key)) {
              const prod = productos.get(key)!;
              prod.cantidad += producto.cantidad;
              prod.total += producto.cantidad * producto.precioUnitario;
            } else {
              // Aquí normalmente obtendríamos el nombre desde el backend
              productos.set(key, {
                id: producto.productoId,
                nombre: `Producto ${producto.productoId}`,
                cantidad: producto.cantidad,
                precio: producto.precioUnitario,
                total: producto.cantidad * producto.precioUnitario,
                categoria: 'Sin categoría'
              });
            }
          });
        });

        return Array.from(productos.values())
          .sort((a, b) => b.cantidad - a.cantidad);
      })
    );
  }

  /**
   * Obtener top productos más vendidos
   */
  getTopProductos(limite: number = 5): Observable<EstadisticaProducto[]> {
    return this.getEstadisticasProductos().pipe(
      map(productos => productos.slice(0, limite))
    );
  }

  /**
   * Exportar reporte de ventas
   */
  exportarReporte(tipo: 'ventas' | 'gastos' | 'productos', fechaInicio: string, fechaFin: string): Observable<string> {
    // Placeholder para futuro desarrollo
    const nombreArchivo = `reporte_${tipo}_${fechaInicio}_${fechaFin}.pdf`;
    return new Observable(observer => {
      observer.next(nombreArchivo);
      observer.complete();
    });
  }

  /**
   * Imprimir reporte
   */
  imprimirReporte(tipo: 'ventas' | 'gastos' | 'productos'): Observable<boolean> {
    // Placeholder para futuro desarrollo
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Obtener estado de caja
   */
  getEstadoCaja(): Observable<Caja> {
    // Placeholder - implementar cuando haya un módulo de cajas en el backend
    return new Observable(observer => {
      observer.next({
        id: '1',
        estado: 'abierta',
        fechaApertura: new Date().toISOString(),
        montoInicial: 100.00,
        usuarioApertura: 'admin'
      });
      observer.complete();
    });
  }

  /**
   * Obtener caja abierta
   */
  async obtenerCajaAbierta(): Promise<Caja | null> {
    // Placeholder - implementar cuando haya un módulo de cajas
    return null;
  }

  /**
   * Obtener cajas cerradas
   */
  async obtenerCajasCerradas(fechaInicio: string, fechaFin: string): Promise<any[]> {
    // Placeholder - implementar cuando haya un módulo de cajas
    return [];
  }

  /**
   * Abrir caja
   */
  async abrirCaja(montoInicial: number): Promise<Caja> {
    // Placeholder - implementar cuando haya un módulo de cajas
    return {
      id: Date.now().toString(),
      estado: 'abierta',
      fechaApertura: new Date().toISOString(),
      montoInicial: montoInicial,
      usuarioApertura: 'admin'
    };
  }

  /**
   * Cerrar caja
   */
  async cerrarCaja(cajaId: string): Promise<void> {
    // Placeholder - implementar cuando haya un módulo de cajas
    console.log(`Caja ${cajaId} cerrada`);
  }
}


