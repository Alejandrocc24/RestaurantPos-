import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaProducto } from '../../services/categoria.service';
import { CategoriaService } from '../../services/categoria.service';
import { ConfirmModalComponent } from '../../shared/confirm-modal';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-categoria-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="modal-overlay" (click)="cerrarModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ esEdicion ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
          <button class="close-btn" (click)="cerrarModal()">&times;</button>
        </div>
        
        <div class="modal-body">
          <form (ngSubmit)="guardarCategoria()">
            <div class="form-group">
              <label for="nombre" [class.is-invalid]="errores['nombre']">Nombre *</label>
              <input 
                type="text" 
                id="nombre"
                name="nombre"
                [(ngModel)]="categoriaForm.nombre"
                (input)="validarNombre()"
                required
                maxlength="100"
                class="form-control"
                [class.is-invalid]="errores['nombre']"
                placeholder="Ingresa el nombre de la categoría">
              <div class="error-message" *ngIf="errores['nombre']">
                {{ errores['nombre'] }}
              </div>
              <div class="validating-message" *ngIf="validandoNombre">
                Verificando nombre...
              </div>
            </div>
            
            <div class="form-group">
              <label for="estado">Estado</label>
              <select 
                id="estado"
                name="estado"
                [(ngModel)]="categoriaForm.estado"
                class="form-control">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="subcategorias">
                Subcategorías 
                <span class="subcategoria-count" *ngIf="obtenerCantidadSubcategorias() > 0">
                  ({{ obtenerCantidadSubcategorias() }})
                </span>
              </label>
              <div class="subcategorias-container">
                <div class="subcategoria-input-group">
                  <input 
                    type="text" 
                    #nuevaSubcategoria
                    placeholder="Agregar nueva subcategoría (mín. 2 caracteres)"
                    class="form-control subcategoria-input"
                    maxlength="50"
                    (keyup.enter)="agregarSubcategoria(nuevaSubcategoria.value); nuevaSubcategoria.value = ''">
                  <button 
                    type="button" 
                    class="btn btn-sm btn-primary"
                    (click)="agregarSubcategoria(nuevaSubcategoria.value); nuevaSubcategoria.value = ''">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                
                <div class="error-message" *ngIf="errores['subcategorias']">
                  {{ errores['subcategorias'] }}
                </div>
                
                <div class="subcategorias-header" *ngIf="categoriaForm.subcategorias && categoriaForm.subcategorias.length > 0">
                  <span class="subcategorias-title">Subcategorías agregadas:</span>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-danger"
                    (click)="limpiarSubcategorias()"
                    title="Eliminar todas las subcategorías">
                    <i class="fas fa-trash"></i> Limpiar
                  </button>
                </div>
                
                <div class="subcategorias-list" *ngIf="categoriaForm.subcategorias && categoriaForm.subcategorias.length > 0">
                  <div class="subcategoria-item" *ngFor="let subcategoria of categoriaForm.subcategorias; let i = index">
                    <span class="subcategoria-nombre">{{ subcategoria }}</span>
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger"
                      (click)="eliminarSubcategoria(i)"
                      title="Eliminar esta subcategoría">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <div class="no-subcategorias" *ngIf="!categoriaForm.subcategorias || categoriaForm.subcategorias.length === 0">
                  <p class="text-muted">No hay subcategorías agregadas</p>
                  <small class="text-info">Puedes agregar múltiples subcategorías para organizar mejor tus productos</small>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
          <button 
            class="btn btn-primary" 
            (click)="confirmarGuardado()"
            [disabled]="!esFormularioValido() || guardando || validandoNombre">
            <span *ngIf="!guardando">{{ esEdicion ? 'Actualizar' : 'Crear' }}</span>
            <span *ngIf="guardando">Guardando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación personalizado -->
    <app-confirm-modal
      *ngIf="mostrarConfirmacion"
      [titulo]="tituloConfirmacion"
      [mensaje]="mensajeConfirmacion"
      [textoConfirmar]="esEdicion ? 'Actualizar' : 'Crear'"
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
      max-width: 500px;
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
    
    .validating-message {
      color: #6c757d;
      font-size: 12px;
      margin-top: 5px;
      font-style: italic;
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
    
    /* Estilos para subcategorías */
    .subcategorias-container {
      margin-top: 8px;
    }
    
    .subcategoria-input-group {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .subcategoria-input {
      flex: 1;
      margin-bottom: 0;
    }
    
    .btn-sm {
      padding: 8px 12px;
      font-size: 12px;
      min-width: auto;
    }
    
    .subcategorias-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      background-color: #f8f9fa;
    }
    
    .subcategoria-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #e9ecef;
      background-color: white;
    }
    
    .subcategoria-item:last-child {
      border-bottom: none;
    }
    
    .subcategoria-nombre {
      font-size: 14px;
      color: #495057;
      flex: 1;
    }
    
    .no-subcategorias {
      text-align: center;
      padding: 20px;
      color: #6c757d;
      font-style: italic;
    }
    
    .no-subcategorias p {
      margin: 0;
      font-size: 14px;
    }
    
    .subcategoria-count {
      color: #6c757d;
      font-weight: normal;
      font-size: 0.9em;
    }
    
    .subcategorias-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px 0;
    }
    
    .subcategorias-title {
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
    
    .subcategoria-input {
      maxlength: 50;
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
        font-size: 16px; /* Evitar zoom en iOS */
        border-radius: 8px;
      }
      
      .subcategorias-container {
        margin-top: 12px;
      }
      
      .subcategoria-input-group {
        flex-direction: column;
        gap: 8px;
      }
      
      .subcategoria-input {
        width: 100%;
        margin-bottom: 0;
      }
      
      .btn-sm {
        width: 100%;
        padding: 12px;
        font-size: 14px;
        justify-content: center;
      }
      
      .subcategorias-header {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      
      .subcategorias-title {
        font-size: 16px;
      }
      
      .btn-outline-danger {
        width: 100%;
        padding: 10px;
        font-size: 14px;
      }
      
      .subcategorias-list {
        max-height: 150px;
      }
      
      .subcategoria-item {
        padding: 10px;
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      
      .subcategoria-nombre {
        font-size: 16px;
        text-align: center;
      }
      
      .no-subcategorias {
        padding: 16px;
      }
      
      .no-subcategorias p {
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
      
      .validating-message {
        font-size: 14px;
        margin-top: 6px;
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
      
      .subcategoria-item {
        padding: 8px;
      }
      
      .subcategoria-nombre {
        font-size: 15px;
      }
    }
  `]
})
export class CategoriaModalComponent implements OnInit, OnDestroy {
  @Input() categoria: CategoriaProducto | null = null;
  @Input() esEdicion = false;
  @Output() guardar = new EventEmitter<CategoriaProducto>();
  @Output() cerrar = new EventEmitter<void>();
  
  categoriaForm: Partial<CategoriaProducto> = {};
  guardando = false;
  validandoNombre = false;
  errores: { [key: string]: string } = {};
  
  // Variables para el modal de confirmación
  mostrarConfirmacion = false;
  tituloConfirmacion = '';
  mensajeConfirmacion = '';
  
  private subscription = new Subscription();

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    if (this.categoria) {
      // Modo edición - copiar datos existentes
      this.categoriaForm = { ...this.categoria };
    } else {
      // Modo creación - valores por defecto
      this.categoriaForm = {
        nombre: '',
        estado: 'activo',
        subcategorias: []
      };
    }
    
    // Limpiar errores previos y resetear estado
    this.errores = {};
    this.validandoNombre = false;
    this.guardando = false;
    
    // Validar inicialmente para limpiar errores previos
    this.validarNombre();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  validarNombre(): void {
    const nombre = this.categoriaForm.nombre?.trim();
    
    // Limpiar errores previos
    delete this.errores['nombre'];
    
    // Si no hay nombre, no mostrar error hasta que el usuario interactúe
    if (!nombre) {
      return;
    }
    
    if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
      return;
    }
    
    if (nombre.length > 100) {
      this.errores['nombre'] = 'El nombre no puede exceder 100 caracteres';
      return;
    }
    
    // Solo validar nombre único si hay un nombre válido
    if (nombre.length >= 3) {
      // Validar nombre único con debounce
      this.validandoNombre = true;
      this.subscription.add(
        this.categoriaService.verificarNombreUnico(
          nombre, 
          this.esEdicion ? this.categoria?.id : undefined
        ).subscribe({
          next: (esUnico) => {
            this.validandoNombre = false;
            if (!esUnico) {
              this.errores['nombre'] = 'Ya existe una categoría con este nombre';
            }
          },
          error: () => {
            this.validandoNombre = false;
            // En caso de error, permitir continuar
          }
        })
      );
    }
  }

  esFormularioValido(): boolean {
    const nombre = this.categoriaForm.nombre?.trim();
    const nombreValido = !!(nombre && nombre.length >= 3 && nombre.length <= 100);
    
    const sinErrores = !this.errores['nombre'] && !this.errores['subcategorias'];
    const noValidando = !this.validandoNombre;
    
    console.log('Validación del formulario:', {
      nombre: this.categoriaForm.nombre,
      nombreValido,
      sinErrores,
      noValidando,
      errores: this.errores,
      subcategorias: this.categoriaForm.subcategorias
    });
    
    return nombreValido && sinErrores && noValidando;
  }

  confirmarGuardado(): void {
    // Validar que el nombre esté presente antes de mostrar la confirmación
    if (!this.categoriaForm.nombre?.trim()) {
      this.errores['nombre'] = 'El nombre es obligatorio';
      return;
    }
    
    if (!this.esFormularioValido()) {
      return;
    }

    // Mostrar modal de confirmación personalizado
    this.tituloConfirmacion = this.esEdicion ? 'Confirmar Actualización' : 'Confirmar Creación';
    this.mensajeConfirmacion = this.esEdicion 
      ? `¿Estás seguro de que quieres actualizar la categoría "${this.categoriaForm.nombre}"?`
      : `¿Estás seguro de que quieres crear la categoría "${this.categoriaForm.nombre}"?`;
    
    this.mostrarConfirmacion = true;
  }

  procederGuardado(): void {
    this.mostrarConfirmacion = false;
    this.guardarCategoria();
  }

  cancelarConfirmacion(): void {
    this.mostrarConfirmacion = false;
  }

  guardarCategoria(): void {
    // Limpiar errores previos para validar desde cero
    this.errores = {};

    // Validar nombre
    const nombre = this.categoriaForm.nombre?.trim();
    if (!nombre) {
      this.errores['nombre'] = 'El nombre de la categoría es obligatorio';
    } else if (nombre.length < 3) {
      this.errores['nombre'] = 'El nombre debe tener al menos 3 caracteres';
    } else if (nombre.length > 100) {
      this.errores['nombre'] = 'El nombre no puede exceder 100 caracteres';
    }

    // Si hay errores, no guardar
    if (Object.keys(this.errores).length > 0) {
      console.warn('❌ Formulario inválido:', this.errores);
      return;
    }

    // Asegurar que las subcategorías estén inicializadas
    if (!this.categoriaForm.subcategorias) {
      this.categoriaForm.subcategorias = [];
    }

    // Solo aquí, si todo está validado, setear guardando
    this.guardando = true;
    
    // Emitir la categoría para que el componente padre la procese
    this.guardar.emit(this.categoriaForm as CategoriaProducto);
  }

  resetearGuardando(): void {
    this.guardando = false;
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  agregarSubcategoria(nombre: string): void {
    const nombreLimpio = nombre.trim();
    
    // Validar que no esté vacío
    if (!nombreLimpio) {
      return;
    }
    
    // Validar longitud mínima y máxima
    if (nombreLimpio.length < 2) {
      this.errores['subcategorias'] = 'Las subcategorías deben tener al menos 2 caracteres';
      return;
    }
    
    if (nombreLimpio.length > 50) {
      this.errores['subcategorias'] = 'Las subcategorías no pueden exceder 50 caracteres';
      return;
    }
    
    // Verificar que no exista ya
    if (this.categoriaForm.subcategorias?.includes(nombreLimpio)) {
      this.errores['subcategorias'] = 'Esta subcategoría ya existe';
      return;
    }
    
    // Limpiar errores previos
    delete this.errores['subcategorias'];
    
    // Agregar la subcategoría
    this.categoriaForm.subcategorias = [...(this.categoriaForm.subcategorias || []), nombreLimpio];
  }

  eliminarSubcategoria(index: number): void {
    if (this.categoriaForm.subcategorias && index >= 0 && index < this.categoriaForm.subcategorias.length) {
      this.categoriaForm.subcategorias = this.categoriaForm.subcategorias.filter((_, i) => i !== index);
      // Limpiar errores si se eliminó la subcategoría que causaba el error
      if (this.errores['subcategorias']) {
        delete this.errores['subcategorias'];
      }
    }
  }

  limpiarSubcategorias(): void {
    this.categoriaForm.subcategorias = [];
    delete this.errores['subcategorias'];
  }

  obtenerCantidadSubcategorias(): number {
    return this.categoriaForm.subcategorias?.length || 0;
  }

  async verificarNombreUnico(): Promise<void> {
    if (this.categoriaForm.nombre && this.categoriaForm.nombre.trim()) {
      try {
        const esUnico = await this.categoriaService.verificarNombreUnico(
          this.categoriaForm.nombre.trim(),
          this.categoria?.id
        );
        
        if (esUnico) {
          // this.nombreUnico = true; // This variable is not defined in the original file
          // this.nombreError = ''; // This variable is not defined in the original file
        } else {
          // this.nombreUnico = false; // This variable is not defined in the original file
          // this.nombreError = 'Ya existe una categoría con este nombre'; // This variable is not defined in the original file
        }
      } catch (error) {
        console.error('Error verificando nombre único:', error);
        // this.nombreError = 'Error al verificar nombre único'; // This variable is not defined in the original file
      }
    }
  }
}
