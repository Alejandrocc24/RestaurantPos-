import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from '../shared/confirm-modal';
import { SupabaseService } from '../services/supabase.service';
import { Subscription } from 'rxjs';

export interface ProductoForm {
  nombre: string;
  categoria: string;
  subcategoria?: string;
  descripcion?: string;
  precio: number;
  estado: 'activo' | 'inactivo';
  especial: boolean; // Marca si el producto es especial (personalizable)
  gruposModificadores: string[];
  maxProductosModificadores: number;
  gruposModificadoresConfig: {
    grupoId: string;
    minSelecciones: number;
    maxSelecciones: number;
  }[];
  comentarios: string[]; // Agregamos comentarios al producto
  tiempoPreparacion?: number; // Tiempo de preparación en minutos
}

export interface GrupoModificador {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

@Component({
  selector: 'app-producto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="modal-overlay" (click)="cerrarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ esEdicion ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
          <button class="close-btn" (click)="cerrarModal()">&times;</button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="guardarProducto()">
            <!-- Nombre del Producto -->
            <div class="form-group">
              <label for="nombre" [class.is-invalid]="errores['nombre']">Nombre del Producto *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                [(ngModel)]="productoForm.nombre"
                (input)="validarNombre()"
                required
                maxlength="200"
                class="form-control"
                [class.is-invalid]="errores['nombre']"
                placeholder="Ej: Helado de Vainilla">
              <div class="error-message" *ngIf="errores['nombre']">
                {{ errores['nombre'] }}
              </div>
            </div>

            <!-- Categoría -->
            <div class="form-group">
              <label for="categoria" [class.is-invalid]="errores['categoria']">Categoría *</label>
              <select
                id="categoria"
                name="categoria"
                [(ngModel)]="productoForm.categoria"
                (change)="onCategoriaChange()"
                required
                class="form-control"
                [class.is-invalid]="errores['categoria']">
                <option value="">Selecciona una categoría</option>
                <option *ngFor="let cat of categorias" [value]="categoriaMap[cat]?.id">
                  {{ cat }}
                </option>
              </select>
              <div class="error-message" *ngIf="errores['categoria']">
                {{ errores['categoria'] }}
              </div>
            </div>

            <!-- Subcategoría -->
            <div class="form-group" *ngIf="productoForm.categoria && subcategoriasDisponibles.length > 0">
              <label for="subcategoria">Subcategoría (Opcional)</label>
              <select
                id="subcategoria"
                name="subcategoria"
                [(ngModel)]="productoForm.subcategoria"
                (change)="validarSubcategoria()"
                class="form-control">
                <option value="">Sin subcategoría</option>
                <option *ngFor="let sub of subcategoriasDisponibles" [value]="sub">
                  {{ sub }}
                </option>
              </select>
              <small class="form-text text-muted">
                Puedes seleccionar una subcategoría para organizar mejor tus productos
              </small>
            </div>

            <!-- Precio -->
            <div class="form-group">
              <label for="precio" [class.is-invalid]="errores['precio']">Precio *</label>
              <div class="input-group">
                <span class="input-prefix">$</span>
                <input
                  type="text"
                  name="precio"
                  [ngModel]="precio"
                  (ngModelChange)="onPrecioChange($event)"
                  placeholder="Ingrese precio"
                  class="form-control"
                  [class.is-invalid]="errores['precio']">
              </div>
              <div class="error-message" *ngIf="errores['precio']">
                {{ errores['precio'] }}
              </div>
            </div>

            <!-- Tiempo de Preparación -->
            <div class="form-group">
              <label for="tiempoPreparacion">Tiempo de Preparación (minutos)</label>
              <input
                type="number"
                id="tiempoPreparacion"
                name="tiempoPreparacion"
                [(ngModel)]="productoForm.tiempoPreparacion"
                min="1"
                max="300"
                class="form-control"
                placeholder="Ej: 15">
              <small class="form-text text-muted">
                Tiempo estimado de preparación que se mostrará en las comandas de cocina
              </small>
            </div>

            <!-- Estado -->
            <div class="form-group">
              <label for="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                [(ngModel)]="productoForm.estado"
                class="form-control">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            <!-- Producto Especial -->
            <div class="form-group">
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    name="especial"
                    [(ngModel)]="productoForm.especial"
                    class="form-checkbox">
                  <span class="checkbox-text">
                    ⭐ Producto Especial (Personalizable)
                  </span>
                </label>
                <small class="form-text text-muted">
                  Marca esta opción si el producto permite personalización con grupos modificadores
                </small>
              </div>
            </div>

            <!-- Grupos Modificadores -->
            <div class="form-group">
              <label for="gruposModificadores">
                Grupos Modificadores
                <span class="grupos-count" *ngIf="productoForm.gruposModificadores.length > 0">
                  ({{ productoForm.gruposModificadores.length }})
                </span>
              </label>
              <div class="grupos-container">
                <div class="grupos-input-group">
                  <select
                    #nuevoGrupo
                    class="form-control grupo-select"
                    (change)="agregarGrupoModificador(nuevoGrupo.value); nuevoGrupo.value = ''">
                    <option value="">Seleccionar grupo modificador</option>
                    <option *ngFor="let grupo of gruposModificadoresDisponibles"
                            [value]="grupo.id"
                            [disabled]="productoForm.gruposModificadores.includes(grupo.id)">
                      {{ grupo.nombre }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    (click)="agregarGrupoModificador(nuevoGrupo.value); nuevoGrupo.value = ''"
                    [disabled]="!nuevoGrupo.value">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>

                <div class="error-message" *ngIf="errores['gruposModificadores']">
                  {{ errores['gruposModificadores'] }}
                </div>

                <div class="grupos-header" *ngIf="productoForm.gruposModificadores.length > 0">
                  <span class="grupos-title">Grupos asignados:</span>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    (click)="limpiarGruposModificadores()"
                    title="Eliminar todos los grupos">
                    <i class="fas fa-trash"></i> Limpiar
                  </button>
                </div>

                <div class="grupos-list" *ngIf="productoForm.gruposModificadores.length > 0">
                  <div class="grupo-item" *ngFor="let grupoId of productoForm.gruposModificadores; let i = index">
                    <span class="grupo-nombre">{{ obtenerNombreGrupo(grupoId) }}</span>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      (click)="eliminarGrupoModificador(i)"
                      title="Eliminar este grupo">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                <div class="no-grupos" *ngIf="productoForm.gruposModificadores.length === 0">
                  <p class="text-muted">No hay grupos modificadores asignados</p>
                  <small class="text-info">Puedes asignar grupos para permitir personalizaciones del producto</small>
                </div>
              </div>
            </div>

            <!-- Configuración Individual de Grupos Modificadores -->
            <div class="form-group" *ngIf="productoForm.gruposModificadores.length > 0">
              <label>Configuración de Grupos Modificadores</label>
              <div class="grupos-config-container">
                <div class="grupo-config-item" *ngFor="let grupoId of productoForm.gruposModificadores; let i = index">
                  <div class="grupo-config-header">
                    <span class="grupo-nombre">{{ obtenerNombreGrupo(grupoId) }}</span>
                  </div>
                  <div class="grupo-config-fields">
                    <div class="config-field">
                      <label [for]="'minSelecciones_' + i">Mínimo de selecciones *</label>
                      <input
                        type="number"
                        [id]="'minSelecciones_' + i"
                        [name]="'minSelecciones_' + i"
                        [(ngModel)]="obtenerConfigGrupo(grupoId).minSelecciones"
                        min="0"
                        max="20"
                        class="form-control"
                        placeholder="0"
                        required>
                      <small class="form-text">
                        Cuántos modificadores debe seleccionar como mínimo (0 = opcional)
                      </small>
                    </div>
                    <div class="config-field">
                      <label [for]="'maxSelecciones_' + i">Máximo de selecciones *</label>
                      <input
                        type="number"
                        [id]="'maxSelecciones_' + i"
                        [name]="'maxSelecciones_' + i"
                        [(ngModel)]="obtenerConfigGrupo(grupoId).maxSelecciones"
                        min="1"
                        max="20"
                        class="form-control"
                        placeholder="1"
                        required>
                      <small class="form-text">
                        Cuántos modificadores puede seleccionar como máximo (mínimo 1)
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comentarios Preestablecidos -->
            <div class="form-group">
              <label for="comentarios">Comentarios Preestablecidos</label>
              <div class="comentarios-container">
                <div class="comentario-item" *ngFor="let comentario of obtenerComentariosPreestablecidos()">
                  <input
                    type="checkbox"
                    [id]="'comentario_' + comentario"
                    [checked]="comentarioEstaSeleccionado(comentario)"
                    (change)="toggleComentario(comentario)"
                    class="form-check-input">
                  <label [for]="'comentario_' + comentario" class="form-check-label">
                    {{ comentario }}
                  </label>
                </div>
              </div>
              <small class="form-text text-muted">
                Selecciona los comentarios que quieras que el cliente pueda agregar al producto.
              </small>
            </div>


          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="confirmarGuardado()"
            [disabled]="!esFormularioValido() || guardando">
            <span *ngIf="!guardando">Guardar</span>
            <span *ngIf="guardando">Guardando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <app-confirm-modal
      *ngIf="mostrarConfirmacion"
      [titulo]="tituloConfirmacion"
      [mensaje]="mensajeConfirmacion"
      [textoConfirmar]="'Guardar'"
      [tipo]="'info'"
      (confirmar)="procederGuardado()"
      (cancelar)="cancelarConfirmacion()">
    </app-confirm-modal>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      transition: color 0.2s;
    }

    .form-group label.is-invalid {
      color: #dc3545;
      font-weight: 700;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .form-control.is-invalid {
      border-color: #dc3545 !important;
      border-width: 2px;
      background-color: #fff5f5;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.15);
    }

    .form-control.is-invalid:focus {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
    }

    .error-message {
      color: #dc3545;
      font-size: 13px;
      margin-top: 6px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .error-message::before {
      content: "⚠️";
      display: inline-block;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    /* Estilos para grupos modificadores */
    .grupos-container {
      margin-top: 8px;
    }

    .grupos-input-group {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .grupo-select {
      flex: 1;
      margin-bottom: 0;
    }

    .btn-sm {
      padding: 8px 12px;
      font-size: 12px;
      min-width: auto;
    }

    .grupos-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      background-color: #f8f9fa;
    }

    .grupo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e9ecef;
      background-color: white;
    }

    .grupo-item:last-child {
      border-bottom: none;
    }

    .grupo-nombre {
      font-size: 14px;
      color: #495057;
      flex: 1;
    }

    .no-grupos {
      text-align: center;
      padding: 20px;
      color: #6c757d;
      font-style: italic;
    }

    .no-grupos p {
      margin: 0;
      font-size: 14px;
    }

    .grupos-count {
      color: #6c757d;
      font-weight: normal;
      font-size: 0.9em;
    }

    .grupos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px 0;
    }

    .grupos-title {
      font-size: 14px;
      color: #495057;
      font-weight: 500;
    }

    .btn-outline-danger {
      background-color: transparent;
      color: #dc3545;
      border: 1px solid #dc3545;
    }

    .btn-outline-danger:hover {
      background-color: #dc3545;
      color: white;
    }

    .text-info {
      color: #17a2b8;
    }

    .form-text {
      font-size: 12px;
      color: #6c757d;
      margin-top: 5px;
    }

    .text-muted {
      color: #6c757d !important;
    }

    /* Estilos para checkbox de producto especial */
    .checkbox-group {
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-bottom: 8px;
      user-select: none;
    }

    .form-checkbox {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      cursor: pointer;
      accent-color: #ffc107;
    }

    .checkbox-text {
      font-size: 15px;
      font-weight: 500;
      color: #333;
    }

    .checkbox-group small {
      display: block;
      margin-left: 30px;
      font-size: 12px;
      color: #6c757d;
      line-height: 1.4;
    }

    .grupos-config-container {
      margin-top: 15px;
    }

    .grupo-config-item {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .grupo-config-header {
      margin-bottom: 12px;
    }

    .grupo-config-header .grupo-nombre {
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }

    .grupo-config-fields {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .config-field {
      display: flex;
      flex-direction: column;
    }

    .config-field label {
      font-size: 12px;
      font-weight: 500;
      color: #495057;
      margin-bottom: 5px;
    }

    .config-field input {
      font-size: 14px;
      padding: 8px 10px;
    }

    .input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-prefix {
      position: absolute;
      left: 12px;
      color: #6c757d;
      font-weight: 500;
      z-index: 2;
    }

    .input-group .form-control {
      padding-left: 30px;
    }

    /* ===== RESPONSIVE PARA MÓVILES ===== */

    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        max-width: none;
        margin: 20px;
        max-height: 85vh;
        border-radius: 12px;
      }

      .modal-header {
        padding: 16px;
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .modal-header h3 {
        font-size: 20px;
        margin-bottom: 8px;
      }

      .close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        font-size: 20px;
      }

      .modal-body {
        padding: 16px;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        font-size: 16px;
        margin-bottom: 6px;
      }

      .form-control {
        padding: 14px;
        font-size: 16px;
        border-radius: 8px;
      }

      .grupos-container {
        margin-top: 12px;
      }

      .grupos-input-group {
        flex-direction: column;
        gap: 8px;
      }

      .grupo-select {
        width: 100%;
        margin-bottom: 0;
      }

      .btn-sm {
        width: 100%;
        padding: 12px;
        font-size: 14px;
        justify-content: center;
      }

      .grupos-header {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }

      .grupos-title {
        font-size: 16px;
      }

      .btn-outline-danger {
        width: 100%;
        padding: 10px;
        font-size: 14px;
      }

      .grupos-list {
        max-height: 150px;
      }

      .grupos-config-container {
        margin-top: 10px;
      }

      .grupo-config-item {
        padding: 12px;
        margin-bottom: 10px;
      }

      .grupo-item {
        padding: 10px;
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }

      .grupo-nombre {
        font-size: 16px;
        text-align: center;
      }

      .no-grupos {
        padding: 16px;
      }

      .no-grupos p {
        font-size: 16px;
        margin-bottom: 8px;
      }

      .text-info {
        font-size: 14px;
        line-height: 1.4;
      }

      .modal-footer {
        padding: 16px;
        flex-direction: column;
        gap: 12px;
      }

      .btn {
        width: 100%;
        padding: 14px;
        font-size: 16px;
        justify-content: center;
        border-radius: 8px;
      }

      .error-message {
        font-size: 14px;
        margin-top: 6px;
      }

      .input-group .form-control {
        padding-left: 35px;
      }

      .input-prefix {
        font-size: 16px;
      }
    }

    @media (max-width: 480px) {
      .modal-content {
        width: 98%;
        margin: 10px;
        max-height: 90vh;
      }

      .modal-header {
        padding: 12px;
      }

      .modal-header h3 {
        font-size: 18px;
      }

      .modal-body {
        padding: 12px;
      }

      .form-control {
        padding: 12px;
        font-size: 16px;
      }

      .btn {
        padding: 12px;
        font-size: 15px;
      }

      .grupo-item {
        padding: 8px;
      }

      .grupo-nombre {
        font-size: 15px;
      }
    }

    /* Estilos para comentarios preestablecidos */
    .comentarios-container {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background: #f8f9fa;
    }

    .comentario-item {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
      transition: background-color 0.2s;
    }

    .comentario-item:last-child {
      border-bottom: none;
    }

    .comentario-item:hover {
      background-color: #e9ecef;
    }

    .form-check-input {
      margin-right: 10px;
      cursor: pointer;
    }

    .form-check-label {
      cursor: pointer;
      user-select: none;
      flex: 1;
    }

    .form-check-input:checked + .form-check-label {
      font-weight: 600;
      color: #007bff;
    }
  `]
})
export class ProductoModalComponent implements OnInit, OnDestroy {
  @Input() producto: any = null;
  @Input() esEdicion = false;
  @Output() guardar = new EventEmitter<ProductoForm>();
  @Output() cerrar = new EventEmitter<void>();

  productoForm: ProductoForm = {
    nombre: '',
    categoria: '',
    subcategoria: '',
    precio: 0,
    estado: 'activo',
    especial: false,
    gruposModificadores: [],
    maxProductosModificadores: 0,
    gruposModificadoresConfig: [],
    comentarios: [],
    tiempoPreparacion: undefined
  };

  guardando = false;
  errores: { [key: string]: string } = {};
  precio: string = '';

  onPrecioChange(rawValue: string) {
    const soloPermitidos = rawValue.replace(/[^\d.,]/g, '');
    const sinSeparadores = soloPermitidos.replace(/\./g, '').replace(',', '.');
    const valor = Number(sinSeparadores);

    if (soloPermitidos.trim() === '' || Number.isNaN(valor)) {
      this.precio = '';
      this.productoForm.precio = 0;
      return;
    }

    const valorNormalizado = parseFloat(valor.toFixed(3));
    this.productoForm.precio = valorNormalizado;
    this.precio = this.formatearPrecio(valorNormalizado);
  }

  getPrecioNumber(): number {
    const valor = Number(this.productoForm.precio);
    return Number.isNaN(valor) ? 0 : valor;
  }

  private formatearPrecio(valor: number): string {
    if (Number.isNaN(valor)) {
      return '';
    }

    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: valor % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 3
    }).format(valor);
  }

  // Variables para el modal de confirmación
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';

  // Categorías disponibles
  categorias: string[] = [];
  categoriaMap: { [nombre: string]: { id: string; nombre: string } } = {};
  categoriasPorId: { [id: string]: { id: string; nombre: string } } = {};

  // Subcategorías por categoría ID (ahora indexadas por ID en lugar de nombre)
  subcategoriasPorCategoria: { [categoriaId: string]: string[] } = {};

  // Grupos modificadores disponibles (desde backend)
  gruposModificadoresDisponibles: GrupoModificador[] = [];

  // Comentarios preestablecidos activos
  comentariosDisponibles: string[] = [];

  get subcategoriasDisponibles(): string[] {
    return this.subcategoriasPorCategoria[this.productoForm.categoria] || [];
  }

  private async cargarOpciones(): Promise<void> {
    try {
      // Categorías con subcategorías
      const cats = await this.supabase.getCategorias({ incluirInactivas: true });
      this.categorias = (cats || []).map((c: any) => c.nombre);
      this.subcategoriasPorCategoria = {};
      this.categoriaMap = {};
      this.categoriasPorId = {};
      
      (cats || []).forEach((c: any) => {
        // Mapear nombre -> {id, nombre} para búsquedas
        this.categoriaMap[c.nombre] = { id: c.id, nombre: c.nombre };
        // Mapear id -> {id, nombre} para búsquedas inversas
        this.categoriasPorId[c.id] = { id: c.id, nombre: c.nombre };
        // Subcategorías indexadas por ID (no por nombre)
        this.subcategoriasPorCategoria[c.id] = Array.isArray(c.subcategorias) ? c.subcategorias : [];
      });
    } catch (e) {
      console.error('Error cargando categorías:', e);
      this.categorias = [];
      this.subcategoriasPorCategoria = {};
      this.categoriaMap = {};
      this.categoriasPorId = {};
    }

    try {
      // Comentarios preestablecidos (activos e inactivos)
      const comentarios = await this.supabase.getComentariosPreestablecidos({ incluirInactivos: true });
      this.comentariosDisponibles = (comentarios || []).map((c: any) => c.texto);
    } catch (e) {
      console.error('Error cargando comentarios preestablecidos:', e);
      this.comentariosDisponibles = [];
    }

    try {
      // Grupos modificadores (activos e inactivos)
      const grupos = await this.supabase.getGruposModificadores({ incluirInactivos: true });
      this.gruposModificadoresDisponibles = (grupos || []).map((g: any) => ({
        id: String(g.id),
        nombre: g.nombre,
        descripcion: g.descripcion,
        activo: !!g.activo
      }));
    } catch (e) {
      console.error('Error cargando grupos modificadores:', e);
      this.gruposModificadoresDisponibles = [];
    }
  }

  constructor(private supabase: SupabaseService) { }

  ngOnInit(): void {
    // Cargar opciones (categorías, subcategorías, grupos, comentarios) desde backend
    this.cargarOpciones();

    if (this.producto) {
      // Modo edición - fusionar con defaults para no perder arrays
      const defaults: ProductoForm = {
        nombre: '',
        categoria: '',
        subcategoria: '',
        precio: 0,
        estado: 'activo',
        especial: false,
        gruposModificadores: [],
        maxProductosModificadores: 0,
        gruposModificadoresConfig: [],
        comentarios: [],
        tiempoPreparacion: undefined
      };
      this.productoForm = { ...defaults, ...(this.producto as any) } as ProductoForm;
      
      // Asegurar que categoria contiene el ID (no el objeto)
      if (typeof this.productoForm.categoria === 'object' && this.productoForm.categoria !== null) {
        // Si viene como objeto, extraer el ID
        this.productoForm.categoria = (this.productoForm.categoria as any).id || '';
      }

      // Asegurar arrays definidos desde posibles campos backend
      // Nota: El backend puede enviar grupos_modificadores o configuracion_grupos
      const gmBackend = (this.producto as any).grupos_modificadores || (this.producto as any).gruposModificadores;
      const gmcBackend = (this.producto as any).configuracionGrupos || (this.producto as any).configuracion_grupos || (this.producto as any).grupos_modificadores_config || (this.producto as any).gruposModificadoresConfig;
      const comentariosBackend = (this.producto as any).comentarios;
      const tiempoPreparacionBackend = (this.producto as any).tiempo_preparacion || (this.producto as any).tiempoPreparacion;

      console.log('📝 Cargando producto en modal:', {
        nombre: this.producto.nombre,
        grupos_modificadores: gmBackend,
        configuracion_grupos: gmcBackend
      });

      // Cargar grupos modificadores
      if (Array.isArray(gmBackend) && gmBackend.length > 0) {
        this.productoForm.gruposModificadores = gmBackend.map((id: any) => String(id));
        console.log('✅ Grupos cargados:', this.productoForm.gruposModificadores);
      } else {
        this.productoForm.gruposModificadores = [];
        console.log('⚠️ No hay grupos modificadores');
      }

      // Cargar configuración de grupos
      if (Array.isArray(gmcBackend) && gmcBackend.length > 0) {
        this.productoForm.gruposModificadoresConfig = gmcBackend.map((c: any) => ({
          grupoId: String(c.grupoId ?? c.grupo_id ?? c.id ?? ''),
          minSelecciones: Number(c.minSelecciones ?? c.min_selecciones ?? 0),
          maxSelecciones: Number(c.maxSelecciones ?? c.max_selecciones ?? 0)
        }));
        console.log('✅ Configuración cargada:', this.productoForm.gruposModificadoresConfig);
      } else {
        this.productoForm.gruposModificadoresConfig = [];
        console.log('⚠️ No hay configuración de grupos');
      }
      
      // Cargar comentarios (puede venir como string JSON o como array)
      if (comentariosBackend) {
        if (typeof comentariosBackend === 'string') {
          this.productoForm.comentarios = JSON.parse(comentariosBackend);
        } else if (Array.isArray(comentariosBackend)) {
          this.productoForm.comentarios = comentariosBackend;
        }
        console.log('✅ Comentarios cargados:', this.productoForm.comentarios);
      } else {
        this.productoForm.comentarios = [];
        console.log('⚠️ No hay comentarios');
      }

      // Cargar tiempo de preparación (puede venir como tiempo_preparacion o tiempoPreparacion)
      if (tiempoPreparacionBackend !== undefined && tiempoPreparacionBackend !== null) {
        this.productoForm.tiempoPreparacion = Number(tiempoPreparacionBackend);
      }

      // Asegurar que existe la configuración de grupos
      if (!this.productoForm.gruposModificadoresConfig) {
        this.productoForm.gruposModificadoresConfig = [];
      }

      // Crear configuración para grupos que no la tengan
      (this.productoForm.gruposModificadores || []).forEach(grupoId => {
        if (!this.productoForm.gruposModificadoresConfig.find(c => c.grupoId === grupoId)) {
          this.productoForm.gruposModificadoresConfig.push({
            grupoId: grupoId,
            minSelecciones: 0,
            maxSelecciones: 0
          });
        }
      });

    } else {
      // Modo creación - valores por defecto
      this.productoForm = {
        nombre: '',
        categoria: '',
        subcategoria: '',
        precio: 0,
        estado: 'activo',
        especial: false,
        gruposModificadores: [],
        maxProductosModificadores: 0,
        gruposModificadoresConfig: [],
        comentarios: [],
        tiempoPreparacion: undefined
      };
    }

    this.precio = this.productoForm.precio ? this.formatearPrecio(this.productoForm.precio) : '';

    // Limpiar errores previos
    this.errores = {};
  }

  ngOnDestroy(): void { }

  validarNombre(): void {
    const nombre = this.productoForm.nombre?.trim();
    delete this.errores['nombre'];

    if (!nombre) {
      return;
    }

    if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (nombre.length > 200) {
      this.errores['nombre'] = 'El nombre no puede exceder 200 caracteres';
      return;
    }
  }

  validarPrecio(): void {
    const precio = this.getPrecioNumber();
    delete this.errores['precio'];

    if (precio < 0) {
      this.errores['precio'] = 'El precio no puede ser negativo';
      return;
    }
  }

  validarSubcategoria(): void {
    const categoria = this.productoForm.categoria;
    const subcategoria = this.productoForm.subcategoria;
    delete this.errores['subcategoria'];

    // La subcategoría es opcional, no validar si está vacía
    // Solo limpiar errores previos
  }

  onCategoriaChange(): void {
    // Resetear subcategoría cuando cambia la categoría
    this.productoForm.subcategoria = '';
    delete this.errores['categoria'];
    delete this.errores['subcategoria'];
  }

  agregarGrupoModificador(grupoId: string): void {
    if (!grupoId || this.productoForm.gruposModificadores.includes(grupoId)) {
      return;
    }

    this.productoForm.gruposModificadores = [...this.productoForm.gruposModificadores, grupoId];

    // Agregar configuración por defecto para el nuevo grupo
    this.productoForm.gruposModificadoresConfig.push({
      grupoId: grupoId,
      minSelecciones: 0,
      maxSelecciones: 0
    });

    delete this.errores['gruposModificadores'];
  }

  eliminarGrupoModificador(index: number): void {
    if (index >= 0 && index < this.productoForm.gruposModificadores.length) {
      const grupoIdEliminado = this.productoForm.gruposModificadores[index];

      this.productoForm.gruposModificadores = this.productoForm.gruposModificadores.filter((_, i) => i !== index);

      // Eliminar la configuración del grupo eliminado
      this.productoForm.gruposModificadoresConfig = this.productoForm.gruposModificadoresConfig.filter(
        config => config.grupoId !== grupoIdEliminado
      );

      // Si no hay grupos, resetear la cantidad máxima
      if (this.productoForm.gruposModificadores.length === 0) {
        this.productoForm.maxProductosModificadores = 0;
      }
    }
  }

  limpiarGruposModificadores(): void {
    this.productoForm.gruposModificadores = [];
    this.productoForm.gruposModificadoresConfig = [];
    this.productoForm.maxProductosModificadores = 0;
    delete this.errores['gruposModificadores'];
  }

  obtenerNombreGrupo(grupoId: string): string {
    const grupo = this.gruposModificadoresDisponibles.find(g => g.id === grupoId);
    return grupo ? grupo.nombre : 'Grupo desconocido';
  }

  obtenerConfigGrupo(grupoId: string) {
    let config = this.productoForm.gruposModificadoresConfig.find(c => c.grupoId === grupoId);
    if (!config) {
      config = { grupoId, minSelecciones: 0, maxSelecciones: 0 };
      this.productoForm.gruposModificadoresConfig.push(config);
    }
    return config;
  }

  // Métodos para comentarios preestablecidos
  obtenerComentariosPreestablecidos(): string[] {
    return this.comentariosDisponibles;
  }

  obtenerComentariosPorCategoria(categoria: string): string[] {
    const comentariosGuardados = localStorage.getItem('comentariosPreestablecidos');
    if (comentariosGuardados) {
      const comentarios = JSON.parse(comentariosGuardados);
      return comentarios
        .filter((c: any) => c.activo && c.categoria === categoria)
        .map((c: any) => c.texto);
    }
    return [];
  }

  toggleComentario(comentario: string): void {
    const index = this.productoForm.comentarios.indexOf(comentario);
    if (index > -1) {
      this.productoForm.comentarios.splice(index, 1);
    } else {
      this.productoForm.comentarios.push(comentario);
    }
  }

  comentarioEstaSeleccionado(comentario: string): boolean {
    return this.productoForm.comentarios.includes(comentario);
  }

  esFormularioValido(): boolean {
    const nombre = this.productoForm.nombre?.trim();
    const categoria = this.productoForm.categoria;
    const precio = this.getPrecioNumber();

    const nombreValido = !!(nombre && nombre.length >= 3 && nombre.length <= 200);
    const categoriaValida = !!categoria;
    const precioValido = precio >= 0;

    const sinErrores = Object.keys(this.errores).length === 0;

    return nombreValido && categoriaValida && precioValido && sinErrores;
  }

  confirmarGuardado(): void {
    // Limpiar errores previos para validar desde cero
    this.errores = {};

    // Validar nombre
    const nombre = this.productoForm.nombre?.trim();
    if (!nombre) {
      this.errores['nombre'] = 'El nombre es obligatorio';
    } else if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
    } else if (nombre.length > 200) {
      this.errores['nombre'] = 'El nombre no puede exceder 200 caracteres';
    }

    // Validar categoría - campo OBLIGATORIO
    if (!this.productoForm.categoria) {
      this.errores['categoria'] = 'La categoría es obligatoria';
    }

    // Validar precio
    const precio = this.getPrecioNumber();
    if (isNaN(precio) || precio < 0) {
      this.errores['precio'] = 'Ingresa un precio válido (mayor o igual a 0)';
    }

    // Si hay errores, no mostrar confirmación
    if (Object.keys(this.errores).length > 0) {
      console.warn('❌ Formulario inválido:', this.errores);
      return;
    }

    this.tituloConfirmacion = this.esEdicion ? 'Confirmar Actualización' : 'Confirmar Creación';
    this.mensajeConfirmacion = this.esEdicion
      ? `¿Estás seguro de que quieres actualizar el producto "${this.productoForm.nombre}"?`
      : `¿Estás seguro de que quieres crear el producto "${this.productoForm.nombre}"?`;

    this.mostrarConfirmacion = true;
  }

  procederGuardado(): void {
    this.mostrarConfirmacion = false;
    this.guardarProducto();
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
  }

  guardarProducto(): void {
    // Limpiar errores previos para validar desde cero
    this.errores = {};

    // Validar nombre
    const nombre = this.productoForm.nombre?.trim();
    if (!nombre) {
      this.errores['nombre'] = 'El nombre es obligatorio';
    } else if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
    } else if (nombre.length > 200) {
      this.errores['nombre'] = 'El nombre no puede exceder 200 caracteres';
    }

    // Validar categoría
    if (!this.productoForm.categoria) {
      this.errores['categoria'] = 'La categoría es obligatoria';
    }

    // Validar precio
    const precio = this.getPrecioNumber();
    if (isNaN(precio) || precio < 0) {
      this.errores['precio'] = 'Ingresa un precio válido (mayor o igual a 0)';
    }

    // Si hay errores, no guardar
    if (Object.keys(this.errores).length > 0) {
      console.warn('❌ Formulario inválido:', this.errores);
      return;
    }

    // Solo aquí, si todo está validado, setear guardando
    this.guardando = true;

    const precioNormalizado = parseFloat(this.getPrecioNumber().toFixed(3));
    this.productoForm.precio = precioNormalizado;

    // Emitir el producto para que el componente padre lo procese
    this.guardar.emit({
      ...this.productoForm,
      precio: precioNormalizado
    });
  }

  resetearGuardando(): void {
    this.guardando = false;
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
