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
    return resp.data?.[0] ?? null;
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
    const resp = await firstValueFrom(this.api.getPedidoActivoMesa(mesaId.toString()));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener pedido activo');
    return resp.data ?? null;
  }

  async guardarPedidoMesa(mesaId: string | number, payload: any) {
    const resp = await firstValueFrom(this.api.guardarPedidoMesa(mesaId, payload));
    if (!resp?.success) throw new Error(resp?.error || 'Error al guardar pedido');
    return resp.data ?? null;
  }

  async cerrarPedido(pedidoId: string | number) {
    const resp = await firstValueFrom(this.api.cerrarOrden(pedidoId.toString()));
    if (!resp?.success) throw new Error(resp?.error || 'Error al cerrar pedido');
    return true;
  }

  async actualizarCantidadesProductos(pedidoId: string | number, productosActualizados: any[]) {
    const resp = await firstValueFrom(this.api.actualizarCantidadesProductos(pedidoId, productosActualizados));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar cantidades');
    return resp.data ?? null;
  }

  async transferirProductosMesa(payload: any) {
    const resp = await firstValueFrom(this.api.transferirProductosMesa(payload));
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
        payload[key] = mesa[key];
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
      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService
      const ventasResp = await firstValueFrom(this.api.getData('ventas'));
      const ventas = ventasResp.data || [];

      if (!fechaInicio || !fechaFin) {
        return ventas;
      }

      // Filtrar ventas en el rango de fechas
      return ventas.filter((venta: any) => {
        const fechaVenta = venta.fecha?.split('T')[0] || venta.fecha;
        return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
      });
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
      const ventasResp = await firstValueFrom(this.api.getData('ventas'));
      const ventas = ventasResp.data || [];

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
        const metodoPago = (v.metodo_pago || 'efectivo').toLowerCase();
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

      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService
      const ventasResp = await firstValueFrom(this.api.getData('ventas'));
      const ventas = ventasResp.data || [];

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
      return ventasFiltradas.map((venta: any) => ({
        id: venta.id,
        numeroMesa: venta.mesa_id,
        total: venta.total || 0,
        fecha: venta.fecha,
        metodoPago: venta.metodo_pago,
        estado: venta.estado,
        cantidadProductos: 0 // Se puede calcular si es necesario
      }));
    } catch (error) {
      console.error('Error obteniendo mesas cerradas:', error);
      return [];
    }
  }

  async obtenerProductosVenta(ventaId: number): Promise<any[]> {
    try {
      console.log('🔍 Buscando productos para venta ID:', ventaId);

      // ✅ SOLUCIÓN ROBUSTA: Usar el método estándar del ApiService
      // que maneja correctamente los filtros internos
      const ventaResp = await firstValueFrom(this.api.getData('ventas'));
      const ventas = ventaResp.data || [];

      // Filtrar la venta específica usando el ID
      const venta = ventas.find((v: any) => v.id === ventaId);

      console.log('📦 Venta encontrada:', venta);

      if (!venta) {
        console.warn('⚠️ No se encontró la venta con ID:', ventaId);
        return [];
      }

      // Si la venta tiene pedido_id, obtener productos del pedido
      if (venta.pedido_id) {
        console.log('🛒 Obteniendo productos del pedido:', venta.pedido_id);

        const detallesResp = await firstValueFrom(this.api.getData('detalles_pedido'));
        const detalles = detallesResp.data || [];
        const detallesPedido = detalles.filter((d: any) => d.pedido_id === venta.pedido_id);

        console.log('📋 Detalles del pedido:', detallesPedido);

        if (detallesPedido.length === 0) {
          console.warn('⚠️ No se encontraron productos en el pedido, intentando fallback por mesa_id...');

          // Fallback: si tenemos mesa_id, buscar el pedido cerrado de esa mesa y reconstruir
          if (venta.mesa_id) {
            const pedidosResp = await firstValueFrom(this.api.getData('pedidos'));
            const pedidos = pedidosResp.data || [];
            const pedidoCerrado = pedidos
              .filter((p: any) => p.mesa_id === venta.mesa_id && p.estado === 'cerrado')
              .sort((a: any, b: any) => new Date(b.fecha || b.created_at || 0).getTime() - new Date(a.fecha || a.created_at || 0).getTime())[0];

            console.log('🛒 Pedido cerrado (fallback) encontrado:', pedidoCerrado);

            if (pedidoCerrado) {
              const detallesResp2 = await firstValueFrom(this.api.getData('detalles_pedido'));
              const detalles2 = detallesResp2.data || [];
              const detallesPedido2 = detalles2.filter((d: any) => d.pedido_id === pedidoCerrado.id);

              const productosResp2 = await firstValueFrom(this.api.getData('productos'));
              const productos2 = productosResp2.data || [];

              const productosVenta2 = detallesPedido2.map((detalle: any) => {
                const producto = productos2.find((p: any) => p.id === detalle.producto_id);
                return {
                  id: detalle.id,
                  nombre: producto?.nombre || 'Producto',
                  descripcion: producto?.descripcion || '',
                  cantidad: detalle.cantidad || 0,
                  precio: detalle.precio_unitario || 0,
                  subtotal: detalle.subtotal || 0,
                  personalizacion: detalle.personalizacion || '',
                  notas: detalle.notas || ''
                };
              });

              console.log('✅ Productos mapeados (fallback):', productosVenta2);
              return productosVenta2;
            }
          }

          return [];
        }

        // Obtener información de productos
        const productosResp = await firstValueFrom(this.api.getData('productos'));
        const productos = productosResp.data || [];

        // Mapear detalles con información de productos
        const productosVenta = detallesPedido.map((detalle: any) => {
          const producto = productos.find((p: any) => p.id === detalle.producto_id);
          return {
            id: detalle.id,
            nombre: producto?.nombre || 'Producto',
            descripcion: producto?.descripcion || '',
            cantidad: detalle.cantidad || 0,
            precio: detalle.precio_unitario || 0,
            subtotal: detalle.subtotal || 0,
            personalizacion: detalle.personalizacion || '',
            notas: detalle.notas || ''
          };
        });

        console.log('✅ Productos mapeados:', productosVenta);
        return productosVenta;
      }

      // Si no tiene pedido_id, buscar por mesa_id
      if (venta.mesa_id) {
        console.log('🍽️ Buscando pedido por mesa_id:', venta.mesa_id);

        const pedidosResp = await firstValueFrom(this.api.getData('pedidos'));
        const pedidos = pedidosResp.data || [];
        const pedido = pedidos.find((p: any) => p.mesa_id === venta.mesa_id && p.estado === 'cerrado');

        console.log('🛒 Pedido encontrado:', pedido);

        if (!pedido) {
          console.warn('⚠️ No se encontró pedido cerrado para la mesa');
          return [];
        }

        const detallesResp = await firstValueFrom(this.api.getData('detalles_pedido'));
        const detalles = detallesResp.data || [];
        const detallesPedido = detalles.filter((d: any) => d.pedido_id === pedido.id);

        // Obtener información de productos
        const productosResp = await firstValueFrom(this.api.getData('productos'));
        const productos = productosResp.data || [];

        // Mapear detalles con información de productos
        return detallesPedido.map((detalle: any) => {
          const producto = productos.find((p: any) => p.id === detalle.producto_id);
          return {
            id: detalle.id,
            nombre: producto?.nombre || 'Producto',
            descripcion: producto?.descripcion || '',
            cantidad: detalle.cantidad || 0,
            precio: detalle.precio_unitario || 0,
            subtotal: detalle.subtotal || 0,
            personalizacion: detalle.personalizacion || '',
            notas: detalle.notas || ''
          };
        });
      }

      console.warn('⚠️ Venta sin pedido_id ni mesa_id');
      return [];

    } catch (error) {
      console.error('❌ Error obteniendo productos de venta:', error);
      return [];
    }
  }

  async obtenerEstadisticasProductos(fechaInicio: string, fechaFin: string): Promise<any[]> {
    try {
      // ✅ SOLUCIÓN ROBUSTA: Usar método estándar del ApiService
      const ventasResp = await firstValueFrom(this.api.getData('ventas'));
      const ventasAll = ventasResp.data || [];

      // Parse dates and set to start/end of day in local timezone
      let inicio: Date;
      let fin: Date;

      if (fechaInicio) {
        inicio = new Date(fechaInicio + 'T00:00:00');
      } else {
        const now = new Date();
        inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      }

      if (fechaFin) {
        fin = new Date(fechaFin + 'T23:59:59.999');
      } else {
        const now = new Date();
        fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }

      const ventas = ventasAll.filter((v: any) => {
        if (!v.fecha) return false;
        // Parse fecha from DB (may be UTC string without Z)
        const f = new Date(v.fecha);
        if (isNaN(f.getTime())) return false;

        // Compare using local date parts to avoid timezone issues
        const fechaLocal = new Date(f.getFullYear(), f.getMonth(), f.getDate());
        const inicioLocal = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
        const finLocal = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());

        return fechaLocal >= inicioLocal && fechaLocal <= finLocal;
      });

      if (ventas.length === 0) {
        return [];
      }

      const pedidosResp = await firstValueFrom(this.api.getData('pedidos'));
      const pedidoIdsConVenta = new Set(
        ventas.map((v: any) => v.pedido_id).filter((x: any) => x !== null && x !== undefined)
      );

      const detallesResp = await firstValueFrom(this.api.getData('detalles_pedido'));
      const detallesAll = detallesResp.data || [];
      const detalles = detallesAll.filter((d: any) => pedidoIdsConVenta.has(d.pedido_id));

      const productosResp = await firstValueFrom(this.api.getData('productos'));
      const productos = productosResp.data || [];

      const estadisticas: { [key: string]: { cantidad: number; total: number; precio: number; categoria: string } } = {};

      detalles.forEach((detalle: any) => {
        const producto = productos.find((p: any) => p.id === detalle.producto_id);
        if (!producto) return;
        const nombreProducto = producto.nombre;
        if (!estadisticas[nombreProducto]) {
          estadisticas[nombreProducto] = {
            cantidad: 0,
            total: 0,
            precio: detalle.precio_unitario || producto.precio || 0,
            categoria: producto.categoria || 'Sin categoría'
          };
        }
        const cant = Number(detalle.cantidad) || 0;
        const precioU = Number(detalle.precio_unitario) || (producto.precio || 0);
        const subtotal = Number(detalle.subtotal);
        estadisticas[nombreProducto].cantidad += cant;
        estadisticas[nombreProducto].total += Number.isFinite(subtotal) ? subtotal : (cant * precioU);
      });

      return Object.entries(estadisticas).map(([nombre, stats]) => ({
        nombre,
        cantidad: stats.cantidad,
        total: stats.total,
        precio: stats.precio,
        categoria: stats.categoria
      }));
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
