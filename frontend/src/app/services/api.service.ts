import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse, Producto, Mesa, Orden, Gasto, CategoriaGasto, Usuario, Rol } from '../types/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private readonly requestTimeoutMs = 10000;
  private readonly retryAttempts = 1;

  constructor(private http: HttpClient) { }

  private withHandling<T>(observable: Observable<T>): Observable<T> {
    return observable.pipe(
      timeout(this.requestTimeoutMs),
      retry(this.retryAttempts),
      catchError((error) => throwError(() => error))
    );
  }

  // ============ PRODUCTOS ============
  getProductos(skip?: number, take?: number): Observable<ApiResponse<Producto[]>> {
    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    return this.withHandling(this.http.get<ApiResponse<Producto[]>>(`${this.baseUrl}/productos`, { params }));
  }

  getProductoById(id: string): Observable<ApiResponse<Producto>> {
    return this.withHandling(this.http.get<ApiResponse<Producto>>(`${this.baseUrl}/productos/${id}`));
  }

  createProducto(data: Partial<Producto>): Observable<ApiResponse<Producto>> {
    return this.withHandling(this.http.post<ApiResponse<Producto>>(`${this.baseUrl}/productos`, data));
  }

  updateProducto(id: string, data: Partial<Producto>): Observable<ApiResponse<Producto>> {
    console.log(`📤 Actualizando producto ${id}:`, data);
    return this.withHandling(this.http.put<ApiResponse<Producto>>(`${this.baseUrl}/productos/${id}`, data));
  }

  deleteProducto(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/productos/${id}`));
  }

  // ============ MESAS ============
  getMesas(skip?: number, take?: number): Observable<ApiResponse<Mesa[]>> {
    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    return this.withHandling(this.http.get<ApiResponse<Mesa[]>>(`${this.baseUrl}/mesas`, { params }));
  }

  getMesaById(id: string): Observable<ApiResponse<Mesa>> {
    return this.withHandling(this.http.get<ApiResponse<Mesa>>(`${this.baseUrl}/mesas/${id}`));
  }

  createMesa(data: Partial<Mesa>): Observable<ApiResponse<Mesa>> {
    return this.withHandling(this.http.post<ApiResponse<Mesa>>(`${this.baseUrl}/mesas`, data));
  }

  updateMesa(id: string, data: Partial<Mesa>): Observable<ApiResponse<Mesa>> {
    return this.withHandling(this.http.patch<ApiResponse<Mesa>>(`${this.baseUrl}/mesas/${id}`, data));
  }

  deleteMesa(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/mesas/${id}`));
  }

  // ============ ORDENES (VENTAS) ============
  getOrdenes(skip?: number, take?: number): Observable<ApiResponse<Orden[]>> {
    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    return this.withHandling(this.http.get<ApiResponse<Orden[]>>(`${this.baseUrl}/ordenes`, { params }));
  }

  getOrdenById(id: string): Observable<ApiResponse<Orden>> {
    return this.withHandling(this.http.get<ApiResponse<Orden>>(`${this.baseUrl}/ordenes/${id}`));
  }

  getOrdenesPorMesa(mesaId: string): Observable<ApiResponse<Orden[]>> {
    return this.withHandling(this.http.get<ApiResponse<Orden[]>>(`${this.baseUrl}/ordenes/mesa/${mesaId}`));
  }

  createOrden(data: Partial<Orden>): Observable<ApiResponse<Orden>> {
    return this.withHandling(this.http.post<ApiResponse<Orden>>(`${this.baseUrl}/ordenes`, data));
  }

  updateOrden(id: string, data: Partial<Orden>): Observable<ApiResponse<Orden>> {
    return this.withHandling(this.http.patch<ApiResponse<Orden>>(`${this.baseUrl}/ordenes/${id}`, data));
  }

  deleteOrden(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/ordenes/${id}`));
  }

  actualizarEstadoPedido(id: number | string, estado: string): Observable<ApiResponse<Orden>> {
    return this.updateOrden(id.toString(), { estado: estado as any });
  }

  ocultarPedidosCocina(ids: number[]): Observable<ApiResponse<any>> {
    // Si no existe endpoint batch, esto es un placeholder.
    // Idealmente el backend debería soportarlo.
    return this.withHandling(this.http.post<ApiResponse<any>>(`${this.baseUrl}/ordenes/ocultar-cocina`, { ids }));
  }

  // Métodos específicos para órdenes
  getPedidoActivoMesa(mesaId: string): Observable<ApiResponse<Orden>> {
    return this.withHandling(this.http.get<ApiResponse<Orden>>(`${this.baseUrl}/ordenes/mesa/${mesaId}/activa`));
  }

  cerrarOrden(id: string): Observable<ApiResponse<Orden>> {
    return this.withHandling(this.http.patch<ApiResponse<Orden>>(`${this.baseUrl}/ordenes/${id}/cerrar`, {}));
  }

  // ============ GASTOS ============
  getGastos(skip?: number, take?: number): Observable<ApiResponse<Gasto[]>> {
    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    return this.withHandling(this.http.get<ApiResponse<Gasto[]>>(`${this.baseUrl}/gastos`, { params }));
  }

  getGastoById(id: string): Observable<ApiResponse<Gasto>> {
    return this.withHandling(this.http.get<ApiResponse<Gasto>>(`${this.baseUrl}/gastos/${id}`));
  }

  createGasto(data: Partial<Gasto>): Observable<ApiResponse<Gasto>> {
    return this.withHandling(this.http.post<ApiResponse<Gasto>>(`${this.baseUrl}/gastos`, data));
  }

  updateGasto(id: string, data: Partial<Gasto>): Observable<ApiResponse<Gasto>> {
    return this.withHandling(this.http.patch<ApiResponse<Gasto>>(`${this.baseUrl}/gastos/${id}`, data));
  }

  deleteGasto(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/gastos/${id}`));
  }

  // ============ CATEGORIAS DE GASTOS ============
  getCategoriasGastos(skip?: number, take?: number): Observable<ApiResponse<CategoriaGasto[]>> {
    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    return this.withHandling(this.http.get<ApiResponse<CategoriaGasto[]>>(`${this.baseUrl}/categorias`, { params }));
  }

  getCategoriaGastoById(id: string): Observable<ApiResponse<CategoriaGasto>> {
    return this.withHandling(this.http.get<ApiResponse<CategoriaGasto>>(`${this.baseUrl}/categorias/${id}`));
  }

  createCategoriaGasto(data: Partial<CategoriaGasto>): Observable<ApiResponse<CategoriaGasto>> {
    return this.withHandling(this.http.post<ApiResponse<CategoriaGasto>>(`${this.baseUrl}/categorias`, data));
  }

  updateCategoriaGasto(id: string, data: Partial<CategoriaGasto>): Observable<ApiResponse<CategoriaGasto>> {
    return this.withHandling(this.http.patch<ApiResponse<CategoriaGasto>>(`${this.baseUrl}/categorias/${id}`, data));
  }

  deleteCategoriaGasto(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/categorias/${id}`));
  }

  // ============ USUARIOS ============
  getUsuarios(skip?: number, take?: number): Observable<ApiResponse<Usuario[]>> {
    let params = new HttpParams();
    if (skip !== undefined) params = params.set('skip', skip.toString());
    if (take !== undefined) params = params.set('take', take.toString());
    return this.withHandling(this.http.get<ApiResponse<Usuario[]>>(`${this.baseUrl}/usuarios`, { params }));
  }

  getUsuarioById(id: string): Observable<ApiResponse<Usuario>> {
    return this.withHandling(this.http.get<ApiResponse<Usuario>>(`${this.baseUrl}/usuarios/${id}`));
  }

  createUsuario(data: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    return this.withHandling(this.http.post<ApiResponse<Usuario>>(`${this.baseUrl}/usuarios`, data));
  }

  updateUsuario(id: string, data: Partial<Usuario>): Observable<ApiResponse<Usuario>> {
    return this.withHandling(this.http.patch<ApiResponse<Usuario>>(`${this.baseUrl}/usuarios/${id}`, data));
  }

  deleteUsuario(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/usuarios/${id}`));
  }

  // ============ ROLES ============
  getRoles(): Observable<ApiResponse<Rol[]>> {
    return this.withHandling(this.http.get<ApiResponse<Rol[]>>(`${this.baseUrl}/roles`));
  }

  getRolById(id: string): Observable<ApiResponse<Rol>> {
    return this.withHandling(this.http.get<ApiResponse<Rol>>(`${this.baseUrl}/roles/${id}`));
  }

  createRol(data: Partial<Rol>): Observable<ApiResponse<Rol>> {
    return this.withHandling(this.http.post<ApiResponse<Rol>>(`${this.baseUrl}/roles`, data));
  }

  updateRol(id: string, data: Partial<Rol>): Observable<ApiResponse<Rol>> {
    return this.withHandling(this.http.patch<ApiResponse<Rol>>(`${this.baseUrl}/roles/${id}`, data));
  }

  deleteRol(id: string): Observable<ApiResponse<void>> {
    return this.withHandling(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/roles/${id}`));
  }

  // ============ MÉTODOS HEREDADOS (para compatibilidad) ============

  // Método para login (mantenido para compatibilidad con código anterior)
  login(credentials: { username?: string; email?: string; password: string }): Observable<any> {
    return this.withHandling(this.http.post(`${this.baseUrl}/auth/login`, credentials));
  }

  // Método para logout (mantenido para compatibilidad)
  logout(): Observable<any> {
    return this.withHandling(this.http.post(`${this.baseUrl}/auth/logout`, {}));
  }

  // Método genérico getData (para compatibilidad)
  getData(table: string): Observable<any> {
    return this.withHandling(this.http.get(`${this.baseUrl}/${table}`));
  }

  // Método genérico insertData (para compatibilidad con supabase.service)
  insertData(table: string, data: any): Observable<any> {
    return this.withHandling(this.http.post(`${this.baseUrl}/${table}`, data));
  }

  // Método genérico updateData (para compatibilidad con supabase.service)
  updateData(table: string, filter: any, data: any): Observable<any> {
    // Si el filter tiene un 'id', lo usamos en la URL
    if (filter?.id) {
      return this.withHandling(this.http.patch(`${this.baseUrl}/${table}/${filter.id}`, data));
    }
    return this.withHandling(this.http.patch(`${this.baseUrl}/${table}`, { filter, ...data }));
  }

  // Método genérico deleteData (para compatibilidad con supabase.service)
  deleteData(table: string, filter: any): Observable<any> {
    if (filter?.id) {
      return this.withHandling(this.http.delete(`${this.baseUrl}/${table}/${filter.id}`));
    }
    return this.withHandling(this.http.delete(`${this.baseUrl}/${table}`, { body: filter }));
  }

  // Métodos específicos para compatibilidad con supabase.service
  guardarPedidoMesa(mesaId: number | string, payload: any): Observable<any> {
    return this.withHandling(this.http.post(`${this.baseUrl}/ordenes/mesa/${mesaId}`, payload));
  }

  actualizarCantidadesProductos(pedidoId: number | string, productos: any[]): Observable<any> {
    return this.withHandling(this.http.patch(`${this.baseUrl}/ordenes/${pedidoId}/cantidades`, { productos }));
  }

  transferirProductosMesa(payload: any): Observable<any> {
    return this.withHandling(this.http.post(`${this.baseUrl}/ordenes/transferir`, payload));
  }

  // Método genérico para obtener mesas y productos (usado en dashboard)
  getMesasYProductos(): Observable<any> {
    return forkJoin([
      this.getMesas().pipe(catchError(() => of({ data: [] }))),
      this.getProductos().pipe(catchError(() => of({ data: [] })))
    ]).pipe(
      this.withHandling as any,
      timeout(this.requestTimeoutMs)
    );
  }
}
