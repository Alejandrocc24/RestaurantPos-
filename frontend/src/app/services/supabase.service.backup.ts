import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  constructor(private api: ApiService) {}

  // Métodos para productos
  async getProductos() {
    const resp = await firstValueFrom(this.api.getData('productos'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener productos');
    return (resp.data || []).filter((p: any) => p.estado === 'activo');
  }

  async crearProducto(producto: any) {
    const resp = await firstValueFrom(this.api.insertData('productos', producto)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear producto');
    return resp.data?.[0] ?? null;
  }

  async actualizarProducto(id: number, producto: any) {
    const resp = await firstValueFrom(this.api.updateData('productos', { id }, producto)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar producto');
    return resp.data?.[0] ?? null;
  }

  // Métodos para mesas
  async getMesas() {
    const resp = await firstValueFrom(this.api.getData('mesas')));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener mesas');
    return (resp.data || []).filter((m: any) => m.activo === true);
  }

  async actualizarMesa(id: number, mesa: any) {
    const resp = await firstValueFrom(this.api.updateData('mesas', { id }, mesa)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar mesa');
    return resp.data?.[0] ?? null;
  }

  async crearMesa(mesa: any) {
    const resp = await firstValueFrom(this.api.insertData('mesas', mesa)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear mesa');
    return resp.data?.[0] ?? null;
  }

  // Métodos para categorías
  async getCategorias() {
    const resp = await firstValueFrom(this.api.getData('categorias'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener categorías');
    return (resp.data || []).filter((c: any) => c.activo === true);
  }

  async crearCategoria(categoria: any) {
    const resp = await firstValueFrom(this.api.insertData('categorias', categoria)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear categoría');
    return resp.data?.[0] ?? null;
  }

  async actualizarCategoria(id: number, categoria: any) {
    const resp = await firstValueFrom(this.api.updateData('categorias', { id }, categoria)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar categoría');
    return resp.data?.[0] ?? null;
  }

  async cambiarEstadoCategoria(id: number, activo: boolean) {
    const resp = await firstValueFrom(this.api.updateData('categorias', { id }, { activo })));
    if (!resp?.success) throw new Error(resp?.error || 'Error al actualizar estado de categoría');
    return resp.data?.[0] ?? null;
  }

  async eliminarCategoria(id: number) {
    const resp = await firstValueFrom(this.api.deleteData('categorias', { id })));
    if (!resp?.success) throw new Error(resp?.error || 'Error al eliminar categoría');
  }

  async verificarNombreUnicoCategoria(nombre: string, idExcluir?: number) {
    const resp = await this.api.getData('categorias'));
    if (!resp?.success) throw new Error(resp?.error || 'Error al validar nombre de categoría');
    const data = (resp.data || []) as any[];
    const existentes = data.filter((c) => c.nombre === nombre && (!idExcluir || c.id !== idExcluir));
    return existentes.length === 0;
  }

  // Métodos para grupos modificadores
  async getGruposModificadores() {
    const resp = await firstValueFrom(this.api.getData('grupos_modificadores')));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener grupos modificadores');
    return (resp.data || []).filter((g: any) => g.activo === true);
  }

  // Métodos para comentarios
  async getComentariosPreestablecidos() {
    const resp = await firstValueFrom(this.api.getData('comentarios_preestablecidos')));
    if (!resp?.success) throw new Error(resp?.error || 'Error al obtener comentarios');
    return (resp.data || []).filter((c: any) => c.activo === true);
  }

  // Métodos para ventas
  async crearVenta(venta: any) {
    const resp = await firstValueFrom(this.api.insertData('ventas', venta)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear venta');
    return resp.data?.[0] ?? null;
  }

  async getVentas(fechaInicio?: string, fechaFin?: string) {
    let url = `${(this.api as any).baseUrl}/get/ventas?order=fecha&asc=false`;
    if (fechaInicio) url += `&gte_fecha=${encodeURIComponent(fechaInicio)}`;
    if (fechaFin) url += `&lte_fecha=${encodeURIComponent(fechaFin)}`;
    
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json?.success) throw new Error(json?.error || 'Error al obtener ventas');
    return json.data || [];
  }

  // Métodos para gastos
  async crearGasto(gasto: any) {
    const resp = await firstValueFrom(this.api.insertData('gastos', gasto)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al crear gasto');
    return resp.data?.[0] ?? null;
  }

  async getGastos(fechaInicio?: string, fechaFin?: string) {
    let url = `${(this.api as any).baseUrl}/get/gastos?order=fecha&asc=false`;
    if (fechaInicio) url += `&gte_fecha=${encodeURIComponent(fechaInicio)}`;
    if (fechaFin) url += `&lte_fecha=${encodeURIComponent(fechaFin)}`;
    
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json?.success) throw new Error(json?.error || 'Error al obtener gastos');
    return json.data || [];
  }

  async obtenerGastos(fechaInicio?: string, fechaFin?: string) {
    return this.getGastos(fechaInicio, fechaFin);
  }

  // Métodos para caja
  async abrirCaja(montoInicial: number): Promise<any> {
    const caja = {
      fecha: new Date().toISOString(),
      monto_inicial: montoInicial,
      estado: 'abierta',
      usuario_id: 1 // ID del usuario actual
    };
    const resp = await firstValueFrom(this.api.insertData('cajas', caja)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al abrir caja');
    return resp.data?.[0] ?? null;
  }

  async cerrarCaja(id: number, caja: any) {
    const resp = await firstValueFrom(this.api.updateData('cajas', { id }, caja)));
    if (!resp?.success) throw new Error(resp?.error || 'Error al cerrar caja');
    return resp.data?.[0] ?? null;
  }

  async getCajaAbierta() {
    const url = `${(this.api as any).baseUrl}/get/cajas?estado=abierta&limit=1`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json?.success) throw new Error(json?.error || 'Error al obtener caja abierta');
    return json.data?.[0] || null;
  }

  async obtenerCajaAbierta() {
    return this.getCajaAbierta();
  }

  // Métodos adicionales para ventas
  async obtenerRecaudoActual(): Promise<{ total: number; cantidadVentas: number }> {
    const hoy = new Date().toISOString().split('T')[0];
    const ventas = await this.getVentas(hoy, hoy);
    const total = (ventas || []).reduce((sum: number, v: any) => sum + (v.total || 0), 0);
    return { total, cantidadVentas: ventas?.length || 0 };
  }

  async obtenerMesasCerradas(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const url = `${(this.api as any).baseUrl}/get/mesas?estado=cerrada&gte_fecha_cierre=${encodeURIComponent(fechaInicio)}&lte_fecha_cierre=${encodeURIComponent(fechaFin)}`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json?.success) throw new Error(json?.error || 'Error al obtener mesas cerradas');
    return json.data || [];
  }

  async obtenerEstadisticasProductos(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const ventas = await this.getVentas(fechaInicio, fechaFin);
    const estadisticas: { [key: string]: { cantidad: number; total: number } } = {};
    
    (ventas || []).forEach((venta: any) => {
      if (venta.productos) {
        venta.productos.forEach((producto: any) => {
          if (!estadisticas[producto.nombre]) {
            estadisticas[producto.nombre] = { cantidad: 0, total: 0 };
          }
          estadisticas[producto.nombre].cantidad += producto.cantidad || 0;
          estadisticas[producto.nombre].total += producto.subtotal || 0;
        });
      }
    });
    
    return Object.entries(estadisticas).map(([nombre, stats]) => ({ nombre, ...stats }));
  }

  async obtenerCajasCerradas(fechaInicio: string, fechaFin: string): Promise<any[]> {
    const url = `${(this.api as any).baseUrl}/get/cajas?estado=cerrada&gte_fecha_cierre=${encodeURIComponent(fechaInicio)}&lte_fecha_cierre=${encodeURIComponent(fechaFin)}`;
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json?.success) throw new Error(json?.error || 'Error al obtener cajas cerradas');
    return json.data || [];
  }
}
