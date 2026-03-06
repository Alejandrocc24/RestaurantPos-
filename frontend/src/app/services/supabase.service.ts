import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  constructor(private api: ApiService) { }

  private normalizeSubcategorias(raw: any): string[] {
    if (Array.isArray(raw)) {
      return raw
        .map((sub: any) => typeof sub === 'string' ? sub : sub?.nombre)
        .filter((sub: string | undefined): sub is string => !!sub && sub.trim().length > 0);
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .map((sub: any) => typeof sub === 'string' ? sub : sub?.nombre)
            .filter((sub: string | undefined): sub is string => !!sub && sub.trim().length > 0);
        }
      } catch (error) {
        return raw
          .split(',')
          .map(sub => sub.trim())
          .filter(sub => sub.length > 0);
      }
    }

    return [];
  }

  // Métodos para productos
  async getProductos(estado?: 'activo' | 'inactivo') {
    const resp = await firstValueFrom(this.api.getData('productos'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener productos');
    const productos = resp.data || [];
    if (!estado) {
      return productos;
    }
    return productos.filter((p: any) => p.estado === estado);
  }

  async crearProducto(producto: any) {
    const resp = await firstValueFrom(this.api.insertData('productos', producto));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear producto');
    return resp.data?.[0] ?? null;
  }

  async actualizarProducto(id: string | number, producto: any) {
    const resp = await firstValueFrom(this.api.updateData('productos', { id }, producto));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar producto');
    return resp.data?.[0] ?? null;
  }

  // Métodos para mesas
  async getMesas(options: { incluirInactivas?: boolean } = {}) {
    const resp = await firstValueFrom(this.api.getData('mesas'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener mesas');
    const mesas = resp.data || [];
    return options.incluirInactivas ? mesas : mesas.filter((m: any) => m.activo === true);
  }

  async actualizarMesa(id: string | number, mesa: any) {
    const payload = this.sanitizeMesaPayload(mesa);
    const resp = await firstValueFrom(this.api.updateData('mesas', { id }, payload));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar mesa');
    return resp.data ?? null;
  }

  async crearMesa(mesa: any) {
    const payload = this.sanitizeMesaPayload(mesa);
    const resp = await firstValueFrom(this.api.insertData('mesas', payload));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear mesa');
    return resp.data?.[0] ?? null;
  }

  async eliminarMesa(id: string | number) {
    const resp = await firstValueFrom(this.api.deleteData('mesas', { id }));
    if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar mesa');
    return true;
  }

  // Métodos para pedidos de mesas
  async obtenerPedidoActivoMesa(mesaId: string | number) {
    const resp = await this.api.obtenerPedidoActivoMesa(mesaId);
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener pedido activo');
    return resp.data ?? null;
  }

  async guardarPedidoMesa(mesaId: string | number, payload: any) {
    const resp = await this.api.guardarPedidoMesa(mesaId, payload);
    if (!resp?.success) throw new Error(resp?.error || 'Error al guardar pedido');
    return resp;  // Retornar la respuesta completa, no solo .data
  }

  async cerrarPedido(pedidoId: string | number) {
    const resp = await firstValueFrom(this.api.cerrarOrden(pedidoId.toString()));
    if (!resp?.success) throw new Error(resp?.error || 'Error al cerrar pedido');
    return true;
  }

  async actualizarCantidadesProductos(pedidoId: string | number, productosActualizados: any[], esCobro: boolean = false) {
    const resp = await this.api.actualizarCantidadesProductos(pedidoId, productosActualizados, esCobro);
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar cantidades');
    return resp; // Se requiere resp completo porque ahí viene pedidoCerrado
  }

  async transferirProductosMesa(payload: any) {
    const resp = await this.api.transferirProductosMesa(payload);
    if (!resp?.success) throw new Error(resp?.error || 'Error al transferir productos de mesa');
    return resp.data ?? null;
  }

  private sanitizeMesaPayload(mesa: any) {
    const allowedKeys = ['numero', 'capacidad', 'estado', 'posicion', 'ubicacion', 'activo'];
    const payload: Record<string, any> = {};

    if (!mesa || typeof mesa !== 'object') {
      return payload;
    }

    for (const key of allowedKeys) {
      if (mesa[key] !== undefined) {
        // normalize estado values for API compatibility
        if (key === 'estado' && typeof mesa[key] === 'string') {
          const s = mesa[key].toLowerCase();
          switch (s) {
            case 'ocupado':
            case 'ocupada':
              payload[key] = 'OCUPADA';
              break;
            case 'reservada':
              payload[key] = 'RESERVADA';
              break;
            case 'fuera_de_servicio':
              payload[key] = 'FUERA_DE_SERVICIO';
              break;
            default:
              payload[key] = s.toUpperCase();
          }
        } else {
          payload[key] = mesa[key];
        }
      }
    }

    return payload;
  }

  // Métodos para categorías
  async getCategorias(options: { incluirInactivas?: boolean } = {}) {
    const resp = await firstValueFrom(this.api.getData('categorias'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener categorías');
    const categorias = (resp.data || []).map((cat: any) => ({
      ...cat,
      subcategorias: this.normalizeSubcategorias(cat?.subcategorias)
    }));
    return options.incluirInactivas ? categorias : categorias.filter((c: any) => c.activo === true);
  }

  // Categorías sin filtrar (incluye inactivas) - útil para edición de productos
  async getCategoriasAll() {
    return this.getCategorias({ incluirInactivas: true });
  }

  async crearCategoria(categoria: any) {
    const resp = await firstValueFrom(this.api.insertData('categorias', categoria));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear categoría');
    return resp.data ?? null;
  }

  async actualizarCategoria(id: string | number, categoria: any) {
    const resp = await firstValueFrom(this.api.updateData('categorias', { id }, categoria));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar categoría');
    return resp.data ?? null;
  }

  async cambiarEstadoCategoria(id: string | number, activo: boolean) {
    const resp = await firstValueFrom(this.api.updateData('categorias', { id }, { activo }));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar estado de categoría');
    return resp.data ?? null;
  }

  async eliminarCategoria(id: string | number) {
    const resp = await firstValueFrom(this.api.deleteData('categorias', { id }));
    if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar categoría');
  }

  async verificarNombreUnicoCategoria(nombre: string, idExcluir?: string | number) {
    const resp = await firstValueFrom(this.api.getData('categorias'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al validar nombre de categoría');
    const data = (resp.data || []) as any[];
    const existentes = data.filter((c: any) => c.nombre === nombre && (!idExcluir || c.id !== idExcluir));
    return existentes.length === 0;
  }

  // Métodos para grupos modificadores
  async getGruposModificadores(options: { incluirInactivos?: boolean } = {}) {
    const resp = await firstValueFrom(this.api.getData('grupos-modificadores'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener grupos modificadores');
    const grupos = resp.data || [];
    return options.incluirInactivos ? grupos : grupos.filter((g: any) => g.activo === true);
  }

  async crearGrupoModificador(grupo: any) {
    const resp = await firstValueFrom(this.api.insertData('grupos-modificadores', grupo));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear grupo modificador');
    return resp.data?.[0] ?? null;
  }

  async actualizarGrupoModificador(id: number, grupo: any) {
    const resp = await firstValueFrom(this.api.updateData('grupos-modificadores', { id }, grupo));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar grupo modificador');
    return resp.data?.[0] ?? null;
  }

  async eliminarGrupoModificador(id: number) {
    const resp = await firstValueFrom(this.api.deleteData('grupos-modificadores', { id }));
    if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar grupo modificador');
  }

  // Métodos para comentarios preestablecidos
  async getComentariosPreestablecidos(options: { incluirInactivos?: boolean } = {}) {
    try {
      const resp = await firstValueFrom(this.api.getData('comentarios-preestablecidos'));
      if (!resp?.success) throw new Error(resp?.error || 'Error al obtener comentarios preestablecidos');

      const comentarios = resp.data || [];

      // Si incluirInactivos es false, filtrar solo activos
      if (!options.incluirInactivos) {
        return comentarios.filter((c: any) => c.activo === true);
      }

      return comentarios;
    } catch (error) {
      console.error('Error en getComentariosPreestablecidos:', error);
      throw error;
    }
  }

  async crearComentarioPreestablecido(comentario: { texto: string; activo?: boolean }) {
    try {
      const resp = await firstValueFrom(this.api.insertData('comentarios-preestablecidos', comentario));
      if (!resp?.success) throw new Error(resp?.error || 'Error al crear comentario preestablecido');
      return resp.data ?? null;
    } catch (error) {
      console.error('Error en crearComentarioPreestablecido:', error);
      throw error;
    }
  }

  async actualizarComentarioPreestablecido(id: string | number, comentario: { texto?: string; activo?: boolean }) {
    try {
      const resp = await firstValueFrom(this.api.updateData('comentarios-preestablecidos', { id }, comentario));
      if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar comentario preestablecido');
      return resp.data ?? null;
    } catch (error) {
      console.error('Error en actualizarComentarioPreestablecido:', error);
      throw error;
    }
  }

  async eliminarComentarioPreestablecido(id: string | number) {
    try {
      const resp = await firstValueFrom(this.api.deleteData('comentarios-preestablecidos', { id }));
      if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar comentario preestablecido');
      return true;
    } catch (error) {
      console.error('Error en eliminarComentarioPreestablecido:', error);
      throw error;
    }
  }

  // Métodos para ventas
  async crearVenta(venta: any) {
    const resp = await firstValueFrom(this.api.insertData('ventas', venta));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear venta');
    return resp.data?.[0] ?? null;
  }

  async getVentas(fechaInicio?: string, fechaFin?: string) {
    try {
      let url = 'ventas';
      if (fechaInicio || fechaFin) {
        url = `ventas?take=10000`;
        if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
        if (fechaFin) url += `&fechaFin=${fechaFin}`;
      } else {
        url = 'ventas?take=10000';
      }

      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService pasándole el querystring y que lo retorne el backend
      const ventasResp = await firstValueFrom(this.api.getData(url));
      return ventasResp.data || [];
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      return [];
    }
  }

  // Métodos para gastos
  async crearGasto(gasto: any) {
    const resp = await firstValueFrom(this.api.insertData('gastos', gasto));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear gasto');
    return resp.data?.[0] ?? null;
  }

  async getGastos(fechaInicio?: string, fechaFin?: string) {
    try {
      // ✅ FILTRADO EN SERVIDOR: Enviar fechas como parámetros para filtrado en el backend
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const query = params.toString() ? `?${params.toString()}` : '';
      const gastosResp = await firstValueFrom(this.api.getData(`gastos${query}`));
      const gastos = gastosResp.data || [];

      return gastos;
    } catch (error) {
      console.error('Error al obtener gastos:', error);
      return [];
    }
  }

  async obtenerGastos(fechaInicio?: string, fechaFin?: string) {
    return this.getGastos(fechaInicio, fechaFin);
  }

  // Métodos para caja
  async abrirCaja(montoInicial: number): Promise<any> {
    const caja = {
      monto_inicial: montoInicial,
      estado: 'abierta'
    };
    const resp = await firstValueFrom(this.api.insertData('cajas', caja));
    if (!resp?.success) throw new Error(resp?.error || 'Error al abrir caja');
    return resp.data ?? null;
  }

  async cerrarCaja(id: string, caja: any) {
    const resp = await firstValueFrom(this.api.updateData('cajas', { id }, caja));
    if (!resp?.success) throw new Error(resp?.error || 'Error al cerrar caja');
    return resp.data ?? null;
  }

  async getCajaAbierta() {
    try {
      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService
      const cajasResp = await firstValueFrom(this.api.getData('cajas'));
      const cajas = cajasResp.data || [];

      // Buscar caja abierta
      return cajas.find((caja: any) => caja.estado === 'abierta') || null;
    } catch (error) {
      console.error('Error al obtener caja abierta:', error);
      return null;
    }
  }

  async obtenerCajaAbierta() {
    return this.getCajaAbierta();
  }

  // Métodos adicionales para ventas
  async obtenerRecaudoActual(): Promise<{ total: number; cantidadVentas: number; pagosEfectivo: number; pagosTransferencia: number; pagosTarjeta: number }> {
    try {
      // ✅ MANEJO ROBUSTO DE FECHAS: Usar fecha local correctamente
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      const fechaLocal = `${year}-${month}-${day}`;

      console.log('🔍 Obteniendo recaudo para fecha:', fechaLocal);

      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService
      const ventas = await this.getVentas(fechaLocal, fechaLocal);

      console.log('📊 Total de ventas obtenidas:', ventas.length);

      if (!ventas || ventas.length === 0) {
        console.warn('⚠️ No se encontraron ventas en la base de datos');
        return { total: 0, cantidadVentas: 0, pagosEfectivo: 0, pagosTransferencia: 0, pagosTarjeta: 0 };
      }

      // Filtrar ventas del día actual con manejo robusto de fechas
      const ventasHoy = ventas.filter((venta: any) => {
        if (!venta.fecha) {
          console.warn('⚠️ Venta sin fecha:', venta);
          return false;
        }

        // Manejar diferentes formatos de fecha
        let fechaVenta: string;
        if (typeof venta.fecha === 'string') {
          // Si es string con formato ISO, extraer solo la parte de fecha
          fechaVenta = venta.fecha.includes('T') ? venta.fecha.split('T')[0] : venta.fecha;
        } else if (venta.fecha instanceof Date) {
          // Si es objeto Date, formatearlo
          const year = venta.fecha.getFullYear();
          const month = String(venta.fecha.getMonth() + 1).padStart(2, '0');
          const day = String(venta.fecha.getDate()).padStart(2, '0');
          fechaVenta = `${year}-${month}-${day}`;
        } else {
          console.warn('⚠️ Formato de fecha desconocido:', venta.fecha);
          return false;
        }

        const coincide = fechaVenta === fechaLocal;
        if (!coincide) {
          console.log(`❌ Fecha no coincide: ${fechaVenta} !== ${fechaLocal}`);
        }

        return coincide;
      });

      console.log('✅ Ventas del día encontradas:', ventasHoy.length);

      let total = 0;
      let pagosEfectivo = 0;
      let pagosTransferencia = 0;
      let pagosTarjeta = 0;

      ventasHoy.forEach((v: any) => {
        const ventaTotal = Number(v.total) || 0;
        total += ventaTotal;

        // Clasificar por método de pago
        const metodoPago = (v.metodoPago || v.metodo_pago || 'efectivo').toLowerCase();
        if (metodoPago === 'efectivo') {
          pagosEfectivo += ventaTotal;
        } else if (metodoPago === 'transferencia') {
          pagosTransferencia += ventaTotal;
        } else if (metodoPago === 'tarjeta') {
          pagosTarjeta += ventaTotal;
        }

        console.log(`💰 Venta ${v.id}: $${ventaTotal} (${metodoPago})`);
      });

      console.log('📈 Total recaudado hoy:', total);
      console.log('💵 Efectivo:', pagosEfectivo, '| 🏦 Transferencia:', pagosTransferencia, '| 💳 Tarjeta:', pagosTarjeta);

      return { total, cantidadVentas: ventasHoy.length, pagosEfectivo, pagosTransferencia, pagosTarjeta };
    } catch (error) {
      console.error('❌ Error obteniendo recaudo actual:', error);
      return { total: 0, cantidadVentas: 0, pagosEfectivo: 0, pagosTransferencia: 0, pagosTarjeta: 0 };
    }
  }

  async obtenerMesasCerradas(fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      console.log('🔍 Obteniendo mesas cerradas para período:', fechaInicio, 'a', fechaFin);

      // ✅ SOLUCIÓN DIRECTA: Solo necesitamos las ventas, el backend ya incluye la mesa
      const ventas = await this.getVentas(fechaInicio, fechaFin);

      console.log('📊 Total de ventas obtenidas:', ventas.length);

      if (!ventas || ventas.length === 0) {
        console.warn('⚠️ No se encontraron ventas en la base de datos');
        return [];
      }

      // Filtrar ventas en el rango de fechas con manejo robusto
      const ventasFiltradas = ventas.filter((venta: any) => {
        if (!venta.fecha) {
          console.warn('⚠️ Venta sin fecha:', venta);
          return false;
        }

        // Manejar diferentes formatos de fecha
        let fechaVenta: string;
        if (typeof venta.fecha === 'string') {
          fechaVenta = venta.fecha.includes('T') ? venta.fecha.split('T')[0] : venta.fecha;
        } else if (venta.fecha instanceof Date) {
          const year = venta.fecha.getFullYear();
          const month = String(venta.fecha.getMonth() + 1).padStart(2, '0');
          const day = String(venta.fecha.getDate()).padStart(2, '0');
          fechaVenta = `${year}-${month}-${day}`;
        } else {
          console.warn('⚠️ Formato de fecha desconocido:', venta.fecha);
          return false;
        }

        const dentroDelRango = fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
        if (!dentroDelRango) {
          console.log(`❌ Fecha fuera de rango: ${fechaVenta} no está entre ${fechaInicio} y ${fechaFin}`);
        }

        return dentroDelRango;
      });

      console.log('✅ Ventas en el período encontradas:', ventasFiltradas.length);

      if (!ventasFiltradas || ventasFiltradas.length === 0) {
        return [];
      }

      // Mapear cada venta a una mesa cerrada individual
      return ventasFiltradas.map((venta: any) => {
        // La mesa viene included directamente por el backend
        const mesaVenta = venta.mesa;
        const mesaIdVenta = venta.mesaId || venta.mesa_id;
        // cantidadProductos viene directamente del campo de la venta (guardado al cobrar)
        const cantidadProductos = venta.cantidadProductos || 0;

        return {
          id: venta.id,
          numeroMesa: mesaVenta ? mesaVenta.numero : mesaIdVenta,
          total: venta.total || 0,
          fecha: venta.fecha || venta.createdAt,
          metodoPago: venta.metodoPago || venta.metodo_pago,
          estado: venta.estado,
          cantidadProductos: cantidadProductos
        };
      });
    } catch (error) {
      console.error('Error obteniendo mesas cerradas:', error);
      return [];
    }
  }

  async obtenerProductosVenta(ventaId: string): Promise<any[]> {
    try {
      console.log('🔍 Buscando productos para venta ID:', ventaId);

      // Fetch the specific venta by ID directly
      const ventaResp = await firstValueFrom(this.api.getData('ventas/' + ventaId)).catch(() => null);
      let venta = ventaResp?.data;

      // If the endpoint doesn't support by id, fall back to listing and finding
      if (!venta) {
        const ventasResp = await firstValueFrom(this.api.getData('ventas'));
        const ventas = ventasResp.data || [];
        venta = ventas.find((v: any) => v.id === ventaId);
      }

      if (!venta) {
        console.warn('⚠️ No se encontró la venta con ID:', ventaId);
        return [];
      }

      // ✅ PRIMERO: Intentar usar el snapshot guardado en productosJson
      if (venta.productosJson) {
        try {
          const productosGuardados = typeof venta.productosJson === 'string'
            ? JSON.parse(venta.productosJson)
            : venta.productosJson;

          if (Array.isArray(productosGuardados) && productosGuardados.length > 0) {
            console.log('✅ Usando productos del snapshot:', productosGuardados.length);
            return productosGuardados.map((p: any) => ({
              id: p.id || '0',
              nombre: p.nombre || 'Producto',
              descripcion: p.descripcion || '',
              cantidad: p.cantidad || 0,
              precio: p.precio || 0,
              subtotal: p.subtotal || (p.cantidad * p.precio) || 0,
              personalizacion: p.comentario || p.personalizacion || '',
              notas: p.notas || ''
            }));
          }
        } catch (e) {
          console.warn('⚠️ Error parseando productosJson, intentando con orden...');
        }
      }

      // FALLBACK: Intentar buscar la orden vinculada (para ventas antiguas sin snapshot)
      const ordenId = venta.ordenId || venta.orden_id;
      if (!ordenId) {
        console.warn('⚠️ La venta no tiene orden vinculada ni snapshot de productos');
        return [];
      }

      const ordenResp = await firstValueFrom(this.api.getData('ordenes/' + ordenId)).catch(() => null);
      const orden = ordenResp?.data;

      if (!orden || !orden.productos || orden.productos.length === 0) {
        console.warn('⚠️ La orden no tiene productos (posiblemente ya cobrada):', ordenId);
        return [];
      }

      console.log('✅ Productos de la orden (fallback):', orden.productos.length);

      return orden.productos.map((item: any) => {
        const producto = item.producto || {};
        return {
          id: item.id,
          nombre: producto.nombre || 'Producto',
          descripcion: producto.descripcion || '',
          cantidad: item.cantidad || 0,
          precio: item.precioUnitario || producto.precio || 0,
          subtotal: item.subtotal || 0,
          personalizacion: item.comentario || item.personalizacion || '',
          notas: item.notas || ''
        };
      });

    } catch (error) {
      console.error('❌ Error obteniendo productos de venta:', error);
      return [];
    }
  }

  async obtenerEstadisticasProductos(fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      let url = 'ventas';
      if (fechaInicio && fechaFin) {
        url = `ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&take=10000`;
      } else {
        url = `ventas?take=10000`;
      }

      const ventasResp = await firstValueFrom(this.api.getData(url));
      const ventasAll = ventasResp.data || [];

      // Mapear catálogo de productos para obtener categoría (ya que el JSON guardado antes podía no tenerla)
      const { data: productosCatalog } = await firstValueFrom(this.api.getData('productos')).catch(() => ({ data: [] }));
      const categoriasPorDefecto: Record<string, string> = {};
      (productosCatalog || []).forEach((p: any) => {
        if (p.nombre) {
          categoriasPorDefecto[p.nombre] = p.categoria?.nombre || p.categoria || 'Sin categoría';
        }
      });

      const estadisticas: { [key: string]: { cantidad: number; total: number; precio: number; categoria: string } } = {};

      ventasAll.forEach((venta: any) => {
        if (venta.productosJson) {
          let productos = [];
          try {
            productos = typeof venta.productosJson === 'string' ? JSON.parse(venta.productosJson) : venta.productosJson;
          } catch (e) { }

          if (Array.isArray(productos)) {
            productos.forEach((item: any) => {
              const nombreProducto = item.nombre || item.producto?.nombre;
              if (!nombreProducto) return;

              if (!estadisticas[nombreProducto]) {
                estadisticas[nombreProducto] = {
                  cantidad: 0,
                  total: 0,
                  precio: Number(item.precio || item.precioUnitario || item.producto?.precio || 0),
                  categoria: item.categoria || item.producto?.categoria || categoriasPorDefecto[nombreProducto] || 'Sin categoría'
                };
              }

              const cant = Number(item.cantidad) || 0;
              const precio = Number(item.precio || item.precioUnitario || item.producto?.precio || 0);
              const subtotal = Number(item.subtotal || (cant * precio)) || 0;

              estadisticas[nombreProducto].cantidad += cant;
              estadisticas[nombreProducto].total += subtotal;
            });
          }
        }
      });

      return Object.entries(estadisticas).map(([nombre, stats]) => ({
        nombre,
        cantidad: stats.cantidad,
        total: stats.total,
        precio: stats.precio,
        categoria: stats.categoria
      })).sort((a, b) => b.cantidad - a.cantidad);
    } catch (error) {
      console.error('Error obteniendo estadísticas de productos:', error);
      return [];
    }
  }

  async obtenerCajasCerradas(fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      console.log('📦 Obteniendo cajas cerradas del servicio...');

      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService
      const cajasResp = await firstValueFrom(this.api.getData('cajas'));
      const cajas = cajasResp.data || [];

      console.log('Total de cajas en BD:', cajas.length);
      console.log('Todas las cajas:', cajas);

      // Filtrar cajas cerradas en el rango de fechas
      const cajasFiltradas = cajas.filter((caja: any) => {
        console.log('Evaluando caja:', caja);

        if (caja.estado !== 'cerrada') {
          console.log('❌ Caja no cerrada:', caja.estado);
          return false;
        }

        // Usar fecha de cierre si existe, sino fecha de apertura
        const fechaCaja = caja.fecha_cierre || caja.fechaCierre || caja.fecha_apertura || caja.fechaApertura;

        if (!fechaCaja) {
          console.log('❌ Caja sin fecha');
          return false;
        }

        // Convertir fecha de la caja a fecha local (solo fecha, sin hora)
        const fechaCajaDate = new Date(fechaCaja);
        const fechaCajaLocal = new Date(fechaCajaDate.getFullYear(), fechaCajaDate.getMonth(), fechaCajaDate.getDate());

        // Convertir fechas de filtro a objetos Date locales
        const [yearInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
        const [yearFin, mesFin, diaFin] = fechaFin.split('-').map(Number);

        const inicio = new Date(yearInicio, mesInicio - 1, diaInicio);
        const fin = new Date(yearFin, mesFin - 1, diaFin);

        // Ajustar fin del día
        fin.setHours(23, 59, 59, 999);

        const enRango = fechaCajaLocal >= inicio && fechaCajaLocal <= fin;
        console.log(`Fecha caja local: ${fechaCajaLocal.toLocaleDateString('es-CO')}, Rango: ${inicio.toLocaleDateString('es-CO')} - ${fin.toLocaleDateString('es-CO')}, En rango: ${enRango}`);

        return enRango;
      });

      console.log('✅ Cajas filtradas:', cajasFiltradas.length);
      return cajasFiltradas;
    } catch (error) {
      console.error('❌ Error obteniendo cajas cerradas:', error);
      return [];
    }
  }

  // Métodos para usuarios
  async getUsuarios(options: { incluirInactivos?: boolean } = {}) {
    const resp = await firstValueFrom(this.api.getData('usuarios'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener usuarios');
    const usuarios = resp.data || [];
    return options.incluirInactivos ? usuarios : usuarios.filter((u: any) => u.activo === true);
  }

  async crearUsuario(usuario: any) {
    const resp = await firstValueFrom(this.api.insertData('usuarios', usuario));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear usuario');
    return resp.data?.[0] ?? null;
  }

  async actualizarUsuario(id: number, usuario: any) {
    const resp = await firstValueFrom(this.api.updateData('usuarios', { id }, usuario));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar usuario');
    return resp.data?.[0] ?? null;
  }

  async eliminarUsuario(id: number) {
    const resp = await firstValueFrom(this.api.deleteData('usuarios', { id }));
    if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar usuario');
    return true;
  }

  // Métodos para roles
  async getRoles(options: { incluirInactivos?: boolean } = {}) {
    const resp = await firstValueFrom(this.api.getData('roles'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener roles');
    const roles = resp.data || [];
    return options.incluirInactivos ? roles : roles.filter((r: any) => r.activo !== false);
  }

  async crearRol(rol: any) {
    const resp = await firstValueFrom(this.api.insertData('roles', rol));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear rol');
    return resp.data?.[0] ?? null;
  }

  async actualizarRol(id: number, rol: any) {
    const resp = await firstValueFrom(this.api.updateData('roles', { id }, rol));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar rol');
    return resp.data?.[0] ?? null;
  }

  async eliminarRol(id: number) {
    const resp = await firstValueFrom(this.api.deleteData('roles', { id }));
    if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar rol');
    return true;
  }
}
