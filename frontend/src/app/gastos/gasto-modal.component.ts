import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastosService } from '../services/gastos.service';
import { NuevoProveedorModalComponent, NuevoProveedorData } from './nuevo-proveedor-modal.component';
import { ToastService } from '../shared/toast/toast.service';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';

import { Gasto } from '../types/api.models';

@Component({
  selector: 'app-gasto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NuevoProveedorModalComponent],
  templateUrl: './gasto-modal.component.html',
  styleUrls: ['./gasto-modal.component.css']
})
export class GastoModalComponent implements OnInit, OnDestroy {
  @Input() gasto: Gasto | null = null;
  @Input() esEdicion: boolean = false;
  @Output() guardar = new EventEmitter<Gasto>();
  @Output() cerrar = new EventEmitter<void>();

  gastoForm: Gasto = {
    id: '',
    descripcion: '',
    monto: 0,
    categoriaId: '',
    categoria: '',
    proveedor: '',
    fecha: new Date(),
    salio_de_caja: true,
    activo: true
  };

  categorias: string[] = [];
  categoriasGastosCompletas: any[] = []; // Almacenar categorías con ID
  proveedores: string[] = [];
  cargando: boolean = false;
  mostrarModalNuevoProveedor: boolean = false;
  mostrarInputProveedorPersonalizado: boolean = false;
  proveedorPersonalizadoTemp: string = '';

  private modalHistoryManager: ModalHistoryManager;

  constructor(
    private gastosService: GastosService,
    private toast: ToastService
  ) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'gasto-modal-base');
  }

  ngOnInit() {
    if (this.gasto && this.esEdicion) {
      this.gastoForm = { ...this.gasto };
    }
    this.cargarCategorias();
    this.cargarProveedores();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  cargarCategorias() {
    this.gastosService.getCategoriasGastos().subscribe({
      next: (categorias) => {
        // Almacenar las categorías completas para poder acceder al ID
        this.categoriasGastosCompletas = categorias.filter(c => c.activo !== false);
        // Crear un array solo con nombres para el display
        this.categorias = this.categoriasGastosCompletas.map(c => c.nombre);

        // Si estamos en modo edición y tenemos un categoriaId, buscar el nombre de la categoría
        if (this.esEdicion && this.gastoForm.categoriaId && !this.gastoForm.categoria) {
          const categoriaEncontrada = this.categoriasGastosCompletas.find(
            c => c.id === this.gastoForm.categoriaId
          );
          if (categoriaEncontrada) {
            this.gastoForm.categoria = categoriaEncontrada.nombre;
          }
        }
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        // Fallback a categorías por defecto
        this.categorias = ['Insumos', 'Equipos', 'Servicios', 'Marketing', 'Otros'];
        this.categoriasGastosCompletas = [];
      }
    });
  }

  cargarProveedores() {
    this.gastosService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores
          .filter(p => p.activo !== false)
          .map(p => p.nombre);
        this.proveedores.push('+ Agregar Nuevo');
        this.proveedores.push('+ Guardar en Base de Datos');
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        // Fallback a proveedores por defecto
        this.proveedores = ['+ Agregar Nuevo', '+ Guardar en Base de Datos'];
      }
    });
  }

  onSubmit() {
    // Validar que la categoría sea requerida
    if (!this.gastoForm.categoria) {
      alert('Por favor seleccione una categoría');
      return;
    }

    // Encontrar el ID de la categoría basado en el nombre
    const categoriaSeleccionada = this.categoriasGastosCompletas.find(
      c => c.nombre === this.gastoForm.categoria
    );

    if (categoriaSeleccionada) {
      this.gastoForm.categoriaId = categoriaSeleccionada.id;
    }

    if (this.esEdicion && this.gasto?.id) {
      this.gastoForm.id = this.gasto.id;
    }

    this.guardar.emit(this.gastoForm);
  }

  onCerrar() {
    this.cerrar.emit();
  }

  onProveedorChange(event: any) {
    const valor = event.target.value;

    if (valor === '+ Agregar Nuevo') {
      // Mostrar input para proveedor personalizado
      this.mostrarInputProveedorPersonalizado = true;
      this.gastoForm.proveedor = '';
      this.proveedorPersonalizadoTemp = '';
      // Enfocar el input después de un momento
      setTimeout(() => {
        const input = document.getElementById('proveedorPersonalizado') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    } else if (valor === '+ Guardar en Base de Datos') {
      // Abrir modal para guardar en BD
      this.modalHistoryManager.registerModalOpen('modal-nuevo-proveedor', this.mostrarModalNuevoProveedor);
      this.mostrarModalNuevoProveedor = true;
      this.gastoForm.proveedor = '';
    } else {
      this.mostrarInputProveedorPersonalizado = false;
    }
  }

  guardarProveedorPersonalizado() {
    if (this.proveedorPersonalizadoTemp.trim()) {
      this.gastoForm.proveedor_personalizado = this.proveedorPersonalizadoTemp.trim();
      this.gastoForm.proveedor = 'Personalizado';
      this.mostrarInputProveedorPersonalizado = false;
      this.toast.info('Proveedor personalizado', `"${this.proveedorPersonalizadoTemp}" será usado solo para este gasto`);
    }
  }

  cancelarProveedorPersonalizado() {
    this.mostrarInputProveedorPersonalizado = false;
    this.proveedorPersonalizadoTemp = '';
    this.gastoForm.proveedor = '';
  }

  onMontoFocus(event: any) {
    // Si el monto es 0, limpiar el campo
    if (this.gastoForm.monto === 0) {
      event.target.value = '';
    }
  }

  onMontoBlur(event: any) {
    // Si el campo está vacío, poner 0
    if (event.target.value === '' || isNaN(parseFloat(event.target.value))) {
      this.gastoForm.monto = 0;
    }
  }

  guardarNuevoProveedor(data: NuevoProveedorData) {
    this.cargando = true;
    this.gastosService.createProveedor({
      nombre: data.nombre,
      tipo: 'General', // Campo requerido por la tabla
      contacto: data.contacto,
      telefono: data.telefono,
      email: data.email,
      activo: true
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success('Proveedor creado', `"${data.nombre}" agregado correctamente`);
          // Seleccionar el nuevo proveedor
          this.gastoForm.proveedor = data.nombre;
          // Recargar la lista de proveedores
          this.cargarProveedores();
          this.cerrarModalNuevoProveedor();
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error creando proveedor:', error);
        this.toast.error('Error', 'No se pudo crear el proveedor');
        this.cargando = false;
      }
    });
  }

  cerrarModalNuevoProveedor(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-nuevo-proveedor');
    }
    this.mostrarModalNuevoProveedor = false;
  }

  onFechaChange(event: any) {
    // Crear fecha local sin conversión a UTC
    const [year, month, day] = event.target.value.split('-');
    this.gastoForm.fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  getFechaString(): string {
    const fecha = this.gastoForm.fecha instanceof Date
      ? this.gastoForm.fecha
      : new Date(this.gastoForm.fecha);

    // Usar fecha local en lugar de UTC para evitar desfases
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private handleModalClose(modalId: string): void {
    if (modalId === 'modal-nuevo-proveedor') {
      this.cerrarModalNuevoProveedor(true);
    }
  }
}
