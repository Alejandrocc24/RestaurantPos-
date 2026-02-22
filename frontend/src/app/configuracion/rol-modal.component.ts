import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rol-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rol-modal.component.html',
  styleUrl: './rol-modal.component.css'
})
export class RolModalComponent implements OnInit, OnChanges {
  @Input() rol: any = null;
  @Input() esEdicion: boolean = false;
  @Output() rolCreado = new EventEmitter<any>();
  @Output() rolEditado = new EventEmitter<any>();
  @Output() modalCerrado = new EventEmitter<void>();

  nuevoRol: any = {
    nombre: '',
    descripcion: '',
    permisos: [],
    activo: true
  };

  permisosPorCategoria = [
    {
      nombre: '👥 Usuarios y Roles',
      icono: '👥',
      permisos: [
        { valor: 'usuarios.ver', etiqueta: 'Ver usuarios', descripcion: 'Visualizar lista de usuarios' },
        { valor: 'usuarios.crear', etiqueta: 'Crear usuarios', descripcion: 'Agregar nuevos usuarios al sistema' },
        { valor: 'usuarios.editar', etiqueta: 'Editar usuarios', descripcion: 'Modificar información de usuarios' },
        { valor: 'usuarios.eliminar', etiqueta: 'Eliminar usuarios', descripcion: 'Eliminar usuarios del sistema' },
        { valor: 'roles.ver', etiqueta: 'Ver roles', descripcion: 'Visualizar roles del sistema' },
        { valor: 'roles.crear', etiqueta: 'Crear roles', descripcion: 'Crear nuevos roles' },
        { valor: 'roles.editar', etiqueta: 'Editar roles', descripcion: 'Modificar roles existentes' },
        { valor: 'roles.eliminar', etiqueta: 'Eliminar roles', descripcion: 'Eliminar roles del sistema' }
      ]
    },
    {
      nombre: '🍨 Productos y Categorías',
      icono: '🍨',
      permisos: [
        { valor: 'productos.ver', etiqueta: 'Ver productos', descripcion: 'Visualizar catálogo de productos' },
        { valor: 'productos.crear', etiqueta: 'Crear productos', descripcion: 'Agregar nuevos productos' },
        { valor: 'productos.editar', etiqueta: 'Editar productos', descripcion: 'Modificar productos existentes' },
        { valor: 'productos.eliminar', etiqueta: 'Eliminar productos', descripcion: 'Eliminar productos del catálogo' },
        { valor: 'categorias.ver', etiqueta: 'Ver categorías', descripcion: 'Visualizar categorías de productos' },
        { valor: 'categorias.crear', etiqueta: 'Crear categorías', descripcion: 'Crear nuevas categorías' },
        { valor: 'categorias.editar', etiqueta: 'Editar categorías', descripcion: 'Modificar categorías' },
        { valor: 'categorias.eliminar', etiqueta: 'Eliminar categorías', descripcion: 'Eliminar categorías' }
      ]
    },
    {
      nombre: '🛒 Ventas y Pedidos',
      icono: '🛒',
      permisos: [
        { valor: 'ventas.ver', etiqueta: 'Ver ventas', descripcion: 'Visualizar historial de ventas' },
        { valor: 'ventas.crear', etiqueta: 'Realizar ventas', descripcion: 'Procesar ventas y cobros' },
        { valor: 'ventas.editar', etiqueta: 'Editar ventas', descripcion: 'Modificar ventas existentes' },
        { valor: 'ventas.anular', etiqueta: 'Anular ventas', descripcion: 'Anular ventas realizadas' },
        { valor: 'pedidos.ver', etiqueta: 'Ver pedidos', descripcion: 'Visualizar pedidos activos' },
        { valor: 'pedidos.crear', etiqueta: 'Crear pedidos', descripcion: 'Crear nuevos pedidos' },
        { valor: 'pedidos.editar', etiqueta: 'Editar pedidos', descripcion: 'Modificar pedidos existentes' },
        { valor: 'pedidos.cerrar', etiqueta: 'Cerrar pedidos', descripcion: 'Finalizar y cerrar pedidos' }
      ]
    },
    {
      nombre: '🪑 Mesas',
      icono: '🪑',
      permisos: [
        { valor: 'mesas.ver', etiqueta: 'Ver mesas', descripcion: 'Visualizar estado de mesas' },
        { valor: 'mesas.gestionar', etiqueta: 'Gestionar mesas', descripcion: 'Abrir, cerrar y administrar mesas' },
        { valor: 'mesas.transferir', etiqueta: 'Transferir productos', descripcion: 'Transferir productos entre mesas' },
        { valor: 'mesas.dividir', etiqueta: 'Dividir cuentas', descripcion: 'Dividir cuenta de una mesa' }
      ]
    },
    {
      nombre: '👨‍🍳 Cocina',
      icono: '👨‍🍳',
      permisos: [
        { valor: 'cocina.ver', etiqueta: 'Ver pedidos cocina', descripcion: 'Visualizar pedidos en cocina' },
        { valor: 'cocina.preparar', etiqueta: 'Preparar pedidos', descripcion: 'Marcar pedidos como en preparación' },
        { valor: 'cocina.completar', etiqueta: 'Completar pedidos', descripcion: 'Marcar pedidos como listos' }
      ]
    },
    {
      nombre: '💰 Caja y Movimientos',
      icono: '💰',
      permisos: [
        { valor: 'caja.ver', etiqueta: 'Ver caja', descripcion: 'Visualizar estado de caja' },
        { valor: 'caja.abrir', etiqueta: 'Abrir caja', descripcion: 'Abrir caja del día' },
        { valor: 'caja.cerrar', etiqueta: 'Cerrar caja', descripcion: 'Cerrar caja y hacer arqueo' },
        { valor: 'movimientos.ver', etiqueta: 'Ver movimientos', descripcion: 'Ver movimientos de caja' },
        { valor: 'movimientos.crear', etiqueta: 'Crear movimientos', descripcion: 'Registrar ingresos/egresos' }
      ]
    },
    {
      nombre: '💸 Gastos',
      icono: '💸',
      permisos: [
        { valor: 'gastos.ver', etiqueta: 'Ver gastos', descripcion: 'Visualizar registro de gastos' },
        { valor: 'gastos.crear', etiqueta: 'Registrar gastos', descripcion: 'Registrar nuevos gastos' },
        { valor: 'gastos.editar', etiqueta: 'Editar gastos', descripcion: 'Modificar gastos registrados' },
        { valor: 'gastos.eliminar', etiqueta: 'Eliminar gastos', descripcion: 'Eliminar gastos del registro' }
      ]
    },
    {
      nombre: '📦 Proveedores',
      icono: '📦',
      permisos: [
        { valor: 'proveedores.ver', etiqueta: 'Ver proveedores', descripcion: 'Visualizar lista de proveedores' },
        { valor: 'proveedores.crear', etiqueta: 'Crear proveedores', descripcion: 'Agregar nuevos proveedores' },
        { valor: 'proveedores.editar', etiqueta: 'Editar proveedores', descripcion: 'Modificar información de proveedores' },
        { valor: 'proveedores.eliminar', etiqueta: 'Eliminar proveedores', descripcion: 'Eliminar proveedores' }
      ]
    },
    {
      nombre: '📊 Reportes y Dashboard',
      icono: '📊',
      permisos: [
        { valor: 'dashboard.ver', etiqueta: 'Ver dashboard', descripcion: 'Acceso al panel principal' },
        { valor: 'reportes.ver', etiqueta: 'Ver reportes', descripcion: 'Visualizar reportes del sistema' },
        { valor: 'reportes.ventas', etiqueta: 'Reporte de ventas', descripcion: 'Ver reporte detallado de ventas' },
        { valor: 'reportes.productos', etiqueta: 'Reporte de productos', descripcion: 'Ver estadísticas de productos' },
        { valor: 'reportes.gastos', etiqueta: 'Reporte de gastos', descripcion: 'Ver análisis de gastos' },
        { valor: 'reportes.exportar', etiqueta: 'Exportar reportes', descripcion: 'Exportar reportes a Excel/PDF' }
      ]
    },
    {
      nombre: '⚙️ Configuración',
      icono: '⚙️',
      permisos: [
        { valor: 'configuracion.ver', etiqueta: 'Ver configuración', descripcion: 'Acceder a configuración del sistema' },
        { valor: 'configuracion.editar', etiqueta: 'Editar configuración', descripcion: 'Modificar configuración general' },
        { valor: 'configuracion.impresoras', etiqueta: 'Configurar impresoras', descripcion: 'Configurar impresoras POS' }
      ]
    }
  ];

  errores: any = {};
  enviando = false;

  constructor() { }

  ngOnInit() {
    // Inicializar los datos del rol si es edición
    if (this.esEdicion && this.rol) {
      this.nuevoRol = {
        id: this.rol.id,
        nombre: this.rol.nombre,
        descripcion: this.rol.descripcion,
        permisos: Array.isArray(this.rol.permisos) ? [...this.rol.permisos] : [],
        activo: this.rol.activo
      };
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si los inputs cambian, actualizar los datos del rol
    if (changes['rol'] && !changes['rol'].firstChange) {
      if (this.esEdicion && this.rol) {
        this.nuevoRol = {
          id: this.rol.id,
          nombre: this.rol.nombre,
          descripcion: this.rol.descripcion,
          permisos: Array.isArray(this.rol.permisos) ? [...this.rol.permisos] : [],
          activo: this.rol.activo
        };
      }
    }
  }

  private cargarDatosRol(): void {
    if (this.esEdicion && this.rol) {
      // Si es edición, copiar los datos del rol
      this.nuevoRol = {
        id: this.rol.id,
        nombre: this.rol.nombre,
        descripcion: this.rol.descripcion,
        permisos: Array.isArray(this.rol.permisos) ? [...this.rol.permisos] : [],
        activo: this.rol.activo
      };
    } else {
      // Si es creación, reinicializar el formulario
      this.limpiarFormulario();
    }
  }

  validarFormulario(): boolean {
    this.errores = {};

    if (!this.nuevoRol.nombre.trim()) {
      this.errores.nombre = 'El nombre del rol es obligatorio';
    }

    if (!this.nuevoRol.descripcion.trim()) {
      this.errores.descripcion = 'La descripción es obligatoria';
    }

    if (this.nuevoRol.permisos.length === 0) {
      this.errores.permisos = 'Debe seleccionar al menos un permiso';
    }

    return Object.keys(this.errores).length === 0;
  }

  togglePermiso(permiso: string, event?: any): void {
    if (event) {
      const isChecked = (event.target as HTMLInputElement).checked;
      const index = this.nuevoRol.permisos.indexOf(permiso);
      
      if (isChecked && index === -1) {
        this.nuevoRol.permisos.push(permiso);
      } else if (!isChecked && index > -1) {
        this.nuevoRol.permisos.splice(index, 1);
      }
    }
  }

  toggleCategoria(categoria: any): void {
    const todosSeleccionados = this.todosSeleccionados(categoria);
    
    if (todosSeleccionados) {
      // Deseleccionar todos los permisos de esta categoría
      categoria.permisos.forEach((permiso: any) => {
        const index = this.nuevoRol.permisos.indexOf(permiso.valor);
        if (index > -1) {
          this.nuevoRol.permisos.splice(index, 1);
        }
      });
    } else {
      // Seleccionar todos los permisos de esta categoría
      categoria.permisos.forEach((permiso: any) => {
        if (!this.nuevoRol.permisos.includes(permiso.valor)) {
          this.nuevoRol.permisos.push(permiso.valor);
        }
      });
    }
  }

  todosSeleccionados(categoria: any): boolean {
    return categoria.permisos.every((permiso: any) => 
      this.nuevoRol.permisos.includes(permiso.valor)
    );
  }

  async guardarRol(): Promise<void> {
    if (!this.validarFormulario()) {
      return;
    }

    this.enviando = true;

    try {
      if (this.esEdicion) {
        // Editar rol existente
        const rolEditado = {
          id: this.nuevoRol.id,
          nombre: this.nuevoRol.nombre,
          descripcion: this.nuevoRol.descripcion,
          permisos: this.nuevoRol.permisos,
          activo: this.nuevoRol.activo
        };
        this.rolEditado.emit(rolEditado);
      } else {
        // Crear nuevo rol
        const rol = {
          nombre: this.nuevoRol.nombre,
          descripcion: this.nuevoRol.descripcion,
          permisos: this.nuevoRol.permisos,
          activo: this.nuevoRol.activo
        };
        this.rolCreado.emit(rol);
      }
      
      // Limpiar formulario y cerrar modal
      this.limpiarFormulario();
      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar rol:', error);
    } finally {
      this.enviando = false;
    }
  }

  limpiarFormulario(): void {
    this.nuevoRol = {
      nombre: '',
      descripcion: '',
      permisos: [],
      activo: true
    };
    this.errores = {};
  }

  cerrarModal(): void {
    this.modalCerrado.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  // Método para compatibilidad con el nombre anterior
  async crearRol(): Promise<void> {
    await this.guardarRol();
  }
}
