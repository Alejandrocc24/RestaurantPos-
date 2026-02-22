import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolModalComponent } from './rol-modal.component';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, RolModalComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit, OnDestroy {
  @Output() viewChangeRequested = new EventEmitter<string>();
  
  sidebarVisible: boolean = false;
  isMobile: boolean = false;
  categoriaSeleccionada: string = 'Todas';
  mostrarModalRol: boolean = false;
  esEdicionRol: boolean = false;
  rolSeleccionado: any = null;
  tabActivo: string = 'roles';
  sidebarInitialized: boolean = false;
  
  // Modal de confirmación
  mostrarConfirmacion: boolean = false;
  confirmacionData: any = null;
  
  // Datos de ejemplo para roles
  roles: any[] = [
    {
      id: 1,
      nombre: 'Administrador',
      codigo: 'admin',
      descripcion: 'Acceso completo al sistema con todos los permisos',
      permisos: ['usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'roles.crear', 'roles.editar', 'roles.eliminar', 'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar', 'reportes.ver', 'configuracion.ver'],
      activo: true,
      fechaCreacion: new Date('2024-01-15')
    },
    {
      id: 2,
      nombre: 'Gerente',
      codigo: 'gerente',
      descripcion: 'Gestión de operaciones y supervisión de personal',
      permisos: ['usuarios.ver', 'usuarios.editar', 'gastos.ver', 'gastos.crear', 'gastos.editar', 'reportes.ver'],
      activo: true,
      fechaCreacion: new Date('2024-01-14')
    },
    {
      id: 3,
      nombre: 'Cajero',
      codigo: 'cajero',
      descripcion: 'Operaciones de caja y ventas',
      permisos: ['ventas.crear', 'ventas.ver', 'gastos.ver', 'gastos.crear'],
      activo: true,
      fechaCreacion: new Date('2024-01-13')
    },
    {
      id: 4,
      nombre: 'Cocina',
      codigo: 'cocina',
      descripcion: 'Preparación de productos y control de inventario',
      permisos: ['inventario.ver', 'inventario.editar', 'productos.ver', 'productos.editar'],
      activo: true,
      fechaCreacion: new Date('2024-01-12')
    },
    {
      id: 5,
      nombre: 'Vendedor',
      codigo: 'vendedor',
      descripcion: 'Atención al cliente y ventas',
      permisos: ['ventas.crear', 'ventas.ver', 'productos.ver', 'clientes.ver'],
      activo: false,
      fechaCreacion: new Date('2024-01-11')
    }
  ];

  rolesFiltrados: any[] = [...this.roles];

  categoriasGastos: string[] = [
    'Todas',
    'Insumos',
    'Equipos',
    'Servicios',
    'Marketing',
    'Otros'
  ];

  private modalHistoryManager: ModalHistoryManager;

  constructor(private router: Router) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'roles-base');
  }

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
    
    // Habilitar transiciones del sidebar después de un breve delay
    setTimeout(() => {
      this.sidebarInitialized = true;
    }, 100);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkMobile());
    this.modalHistoryManager.destroy();
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  navegarAProveedores() {
    this.viewChangeRequested.emit('proveedores');
    this.tabActivo = 'proveedores';
  }

  cambiarTab(tab: string) {
    this.tabActivo = tab;
  }

  navegarACategoriaGastos() {
    this.viewChangeRequested.emit('categoria-gastos');
    this.tabActivo = 'categoria';
  }

  nuevoRol() {
    this.esEdicionRol = false;
    this.rolSeleccionado = null;
    this.modalHistoryManager.registerModalOpen('modal-rol', this.mostrarModalRol);
    this.mostrarModalRol = true;
  }

  editarRol(rol: any) {
    this.esEdicionRol = true;
    // Copiar el rol con todos sus datos, asegurándose que los permisos se copien como array
    this.rolSeleccionado = {
      id: rol.id,
      nombre: rol.nombre,
      codigo: rol.codigo,
      descripcion: rol.descripcion,
      permisos: Array.isArray(rol.permisos) ? [...rol.permisos] : [],
      activo: rol.activo,
      fechaCreacion: rol.fechaCreacion
    };
    this.modalHistoryManager.registerModalOpen('modal-rol', this.mostrarModalRol);
    this.mostrarModalRol = true;
  }

  cerrarModalRol(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-rol');
    }
    this.mostrarModalRol = false;
    this.esEdicionRol = false;
    this.rolSeleccionado = null;
  }

  onRolCreado(rol: any) {
    console.log('Rol creado:', rol);
    try {
      // Crear nuevo rol con ID único
      const nuevoRol: any = {
        id: (this.roles && this.roles.length > 0) ? Math.max(...this.roles.map(r => r.id || 0)) + 1 : 1,
        nombre: rol.nombre || '',
        descripcion: rol.descripcion || '',
        permisos: Array.isArray(rol.permisos) ? [...rol.permisos] : [],
        activo: rol.activo !== undefined ? rol.activo : true,
        codigo: (rol.nombre || '').toLowerCase().replace(/\s+/g, '-'),
        fechaCreacion: new Date()
      };
      
      if (this.roles) {
        this.roles.unshift(nuevoRol);
        this.rolesFiltrados = [...this.roles];
      }
      
      this.cerrarModalRol();
    } catch (error) {
      console.error('Error al crear rol:', error);
    }
  }

  onRolEditado(rol: any) {
    console.log('Rol editado:', rol);
    // Actualizar rol existente
    const index = this.roles.findIndex(r => r.id === rol.id);
    if (index !== -1) {
      // Preservar todos los datos del rol original y actualizar con los nuevos
      this.roles[index] = {
        ...this.roles[index],
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisos: Array.isArray(rol.permisos) ? [...rol.permisos] : [],
        activo: rol.activo
      };
      this.rolesFiltrados = [...this.roles];
    }
    this.cerrarModalRol();
  }

  cambiarEstadoRol(rol: any) {
    const nuevoEstado = !rol.activo;
    
    // Preparar datos para el modal de confirmación
    this.confirmacionData = {
      rol: rol,
      nuevoEstado: nuevoEstado
    };
    
    // Mostrar modal de confirmación
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-rol', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  confirmarCambioEstado() {
    if (this.confirmacionData) {
      const rol = this.confirmacionData.rol;
      const nuevoEstado = this.confirmacionData.nuevoEstado;
      
      // Cambiar el estado del rol
      rol.activo = nuevoEstado;
      
      // Actualizar también en la lista filtrada
      const indexFiltrado = this.rolesFiltrados.findIndex(r => r.id === rol.id);
      if (indexFiltrado !== -1) {
        this.rolesFiltrados[indexFiltrado].activo = nuevoEstado;
      }
      
      const mensaje = nuevoEstado ? 'activado' : 'desactivado';
      console.log(`Rol ${rol.nombre} ${mensaje} exitosamente`);
      
      // Cerrar modal de confirmación
      this.cerrarConfirmacion();
    }
  }

  cerrarConfirmacion(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-rol');
    }
    this.mostrarConfirmacion = false;
    this.confirmacionData = null;
  }

  eliminarRol(rol: any) {
    if (confirm(`¿Está seguro de que desea eliminar el rol "${rol.nombre}"?`)) {
      this.roles = this.roles.filter(r => r.id !== rol.id);
      this.rolesFiltrados = [...this.roles];
    }
  }

  filtrarPorCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    if (categoria === 'Todas') {
      this.rolesFiltrados = [...this.roles];
    } else {
      // Por ahora mantenemos la lógica de filtrado, pero se puede adaptar para roles
      this.rolesFiltrados = [...this.roles];
    }
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-rol':
        this.cerrarModalRol(true);
        break;
      case 'modal-confirmacion-rol':
        this.cerrarConfirmacion(true);
        break;
      default:
        break;
    }
  }
}
