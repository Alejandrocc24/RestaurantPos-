import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioModalComponent } from './usuario-modal.component';
import { RolModalComponent } from './rol-modal.component';
import { ConfigFacturaComponent } from './config-factura/config-factura.component';
import { ToastService } from '../shared/toast/toast.service';
import { SupabaseService } from '../services/supabase.service';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';
import { PrinterService } from '../services/printer.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, UsuarioModalComponent, RolModalComponent, ConfigFacturaComponent],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  @Output() viewChangeRequested = new EventEmitter<string>();
  
  mostrarModalUsuario: boolean = false;
  esEdicionUsuario: boolean = false;
  usuarioSeleccionado: any = null;
  tabActivo: string = 'usuarios';
  private tabHistory: string[] = [this.tabActivo];
  
  // Modal de roles
  mostrarModalRol: boolean = false;
  esEdicionRol: boolean = false;
  rolSeleccionado: any = null;
  
  // Modal de confirmación
  mostrarConfirmacion: boolean = false;
  confirmacionData: any = null;
  
  // Datos de usuarios y roles (cargados desde la base de datos)
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  roles: any[] = [];
  cargandoDatos: boolean = false;

  // Configuración de impresora POS
  configImpresora: any = {
    nombre: 'Impresora Principal',
    puerto: 'USB',
    velocidad: '9600',
    anchoPapel: '80',
    densidad: 'normal',
    margenIzquierdo: 0,
    margenDerecho: 0,
    fuente: 'A',
    tituloEmpresa: 'Heladería Deliciosa',
    subtituloEmpresa: 'Los mejores helados de la ciudad',
    pieTicket: '¡Gracias por su compra!\nVisite nuestra página web: www.heladeria.com\nSíguenos en redes sociales',
    urlQR: 'https://www.heladeria.com',
    mostrarQR: true
  };

  // Estado de la impresora
  estadoImpresora: any = {
    online: true,
    papel: true,
    energia: true
  };

  // Historial de impresiones
  historialImpresion: any[] = [];
  
  // Impresoras disponibles
  impresorasDisponibles: any[] = [];
  cargandoImpresoras: boolean = false;

  private modalHistoryManager: ModalHistoryManager;

  constructor(
    private router: Router, 
    private toast: ToastService,
    private supabase: SupabaseService,
    private printerService: PrinterService
  ) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'configuracion-base');
  }

  ngOnInit() {
    // Cargar datos desde la base de datos
    this.cargarDatos();
    // Cargar configuración guardada
    this.cargarConfiguracion();
    // Cargar impresoras disponibles
    this.cargarImpresorasDisponibles();
    // Verificar estado de la impresora
    this.verificarEstadoImpresora();
  }

  async cargarDatos() {
    this.cargandoDatos = true;
    try {
      // Cargar usuarios y roles en paralelo
      const [usuarios, roles] = await Promise.all([
        this.supabase.getUsuarios({ incluirInactivos: true }),
        this.supabase.getRoles({ incluirInactivos: true })
      ]);
      
      this.usuarios = usuarios;
      this.usuariosFiltrados = [...this.usuarios];
      // Normalizar permisos de roles
      this.roles = roles.map((rol: any) => ({
        ...rol,
        permisos: this.normalizarPermisos(rol.permisos)
      }));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toast.error('Error', 'No se pudieron cargar los datos de configuración');
    } finally {
      this.cargandoDatos = false;
    }
  }

  normalizarPermisos(permisos: any): string[] {
    // Si ya es un array, devolverlo
    if (Array.isArray(permisos)) {
      return permisos;
    }
    
    // Si es un string JSON, parsearlo
    if (typeof permisos === 'string') {
      try {
        const parsed = JSON.parse(permisos);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error al parsear permisos:', error);
        return [];
      }
    }
    
    // Si es null o undefined, devolver array vacío
    return [];
  }

  obtenerPermisosVisibles(permisos: any): string[] {
    const permisosArray = this.normalizarPermisos(permisos);
    return permisosArray.slice(0, 3);
  }

  contarPermisosRestantes(permisos: any): number {
    const permisosArray = this.normalizarPermisos(permisos);
    return Math.max(0, permisosArray.length - 3);
  }

  ngOnDestroy() {
    this.modalHistoryManager.destroy();
  }

  cambiarTab(tab: string, desdeHistorial = false) {
    if (this.tabActivo === tab && !desdeHistorial) {
      return;
    }

    if (desdeHistorial) {
      if (this.tabHistory.length > 1) {
        this.tabHistory.pop();
        this.tabActivo = this.tabHistory[this.tabHistory.length - 1];
      } else {
        this.tabActivo = this.tabHistory[0] || 'usuarios';
      }
      return;
    }

    this.modalHistoryManager.registerModalOpen(`tab-config-${tab}`, this.tabActivo === tab);
    this.tabHistory.push(tab);
    this.tabActivo = tab;
  }

  // ===== FUNCIONES DE USUARIOS =====
  nuevoUsuario() {
    this.esEdicionUsuario = false;
    this.usuarioSeleccionado = null;
    this.modalHistoryManager.registerModalOpen('modal-usuario', this.mostrarModalUsuario);
    this.mostrarModalUsuario = true;
  }

  editarUsuario(usuario: any) {
    this.esEdicionUsuario = true;
    this.usuarioSeleccionado = { ...usuario };
    this.modalHistoryManager.registerModalOpen('modal-usuario', this.mostrarModalUsuario);
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-usuario');
    }
    this.mostrarModalUsuario = false;
    this.esEdicionUsuario = false;
    this.usuarioSeleccionado = null;
  }

  async onUsuarioCreado(usuario: any) {
    try {
      console.log('Usuario creado:', usuario);
      // Crear usuario en la base de datos
      const nuevoUsuario = await this.supabase.crearUsuario({
        nombre: usuario.nombre,
        email: usuario.email,
        password: usuario.password,
        rol: usuario.rol,
        activo: usuario.activo ?? true,
        created_at: new Date().toISOString()
      });
      
      if (nuevoUsuario) {
        // Agregar el nuevo usuario a la lista directamente
        this.usuarios.unshift(nuevoUsuario);
        this.usuariosFiltrados = [...this.usuarios];
        this.toast.success('Usuario creado', `Usuario "${usuario.nombre}" creado exitosamente`);
      }
      this.cerrarModalUsuario();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      this.toast.error('Error', 'No se pudo crear el usuario');
    }
  }

  async onUsuarioEditado(usuario: any) {
    try {
      console.log('Usuario editado:', usuario);
      // Preparar datos para actualizar
      const datosActualizar: any = {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      };
      
      // Solo incluir password si se proporcionó
      if (usuario.password) {
        datosActualizar.password = usuario.password;
      }
      
      // Actualizar usuario en la base de datos
      await this.supabase.actualizarUsuario(usuario.id, datosActualizar);
      
      // Actualizar el usuario en la lista local
      const index = this.usuarios.findIndex(u => u.id === usuario.id);
      if (index !== -1) {
        // Actualizar solo los campos que cambiaron
        this.usuarios[index] = {
          ...this.usuarios[index],
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          activo: usuario.activo
        };
        this.usuariosFiltrados = [...this.usuarios];
      }
      this.toast.success('Usuario actualizado', `Usuario "${usuario.nombre}" actualizado exitosamente`);
      this.cerrarModalUsuario();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      this.toast.error('Error', 'No se pudo actualizar el usuario');
    }
  }

  async cambiarEstadoUsuario(usuario: any) {
    const nuevoEstado = !usuario.activo;
    
    // Preparar datos para el modal de confirmación
    this.confirmacionData = {
      tipo: 'usuario',
      item: usuario,
      nuevoEstado: nuevoEstado
    };
    
    // Mostrar modal de confirmación
    this.abrirModalConfirmacion();
  }

  // ===== FUNCIONES DE ROLES =====
  nuevoRol() {
    this.esEdicionRol = false;
    this.rolSeleccionado = null;
    this.modalHistoryManager.registerModalOpen('modal-rol', this.mostrarModalRol);
    this.mostrarModalRol = true;
  }

  editarRol(rol: any) {
    this.esEdicionRol = true;
    // Asegurar que los permisos estén normalizados al editar
    this.rolSeleccionado = { 
      ...rol,
      permisos: this.normalizarPermisos(rol.permisos)
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

  async onRolCreado(rol: any) {
    try {
      console.log('Rol creado:', rol);
      // Crear rol en la base de datos
      const nuevoRol = await this.supabase.crearRol({
        nombre: rol.nombre,
        codigo: this.generarCodigoRol(rol.nombre),
        descripcion: rol.descripcion,
        permisos: rol.permisos,
        activo: rol.activo ?? true,
        created_at: new Date().toISOString()
      });
      
      if (nuevoRol) {
        // Normalizar permisos antes de agregar a la lista
        nuevoRol.permisos = this.normalizarPermisos(nuevoRol.permisos);
        this.roles.unshift(nuevoRol);
        this.toast.success('Rol creado', `Rol "${rol.nombre}" creado exitosamente`);
      }
      this.cerrarModalRol();
    } catch (error) {
      console.error('Error al crear rol:', error);
      this.toast.error('Error', 'No se pudo crear el rol');
    }
  }

  generarCodigoRol(nombre: string): string {
    // Generar código automáticamente basado en el nombre
    return nombre
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  async onRolEditado(rol: any) {
    try {
      console.log('Rol editado:', rol);
      // Actualizar rol en la base de datos
      const rolActualizado = await this.supabase.actualizarRol(rol.id, {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisos: rol.permisos,
        activo: rol.activo
      });
      
      if (rolActualizado) {
        // Normalizar permisos antes de actualizar
        rolActualizado.permisos = this.normalizarPermisos(rolActualizado.permisos);
        const index = this.roles.findIndex(r => r.id === rol.id);
        if (index !== -1) {
          this.roles[index] = { ...this.roles[index], ...rolActualizado };
        }
        this.toast.success('Rol actualizado', `Rol "${rol.nombre}" actualizado exitosamente`);
      }
      this.cerrarModalRol();
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      this.toast.error('Error', 'No se pudo actualizar el rol');
    }
  }

  async cambiarEstadoRol(rol: any) {
    const nuevoEstado = !rol.activo;
    
    // Preparar datos para el modal de confirmación
    this.confirmacionData = {
      tipo: 'rol',
      item: rol,
      nuevoEstado: nuevoEstado
    };
    
    // Mostrar modal de confirmación
    this.abrirModalConfirmacion();
  }

  async eliminarRol(rol: any) {
    // Preparar datos para el modal de confirmación de eliminación
    this.confirmacionData = {
      tipo: 'eliminacion',
      item: rol,
      accion: 'eliminar'
    };
    
    // Mostrar modal de confirmación
    this.abrirModalConfirmacion();
  }

  // ===== FUNCIONES DE IMPRESORA POS =====
  async cargarImpresorasDisponibles() {
    this.cargandoImpresoras = true;
    try {
      const response = await this.printerService.getAvailablePrinters().toPromise();
      if (response?.success && response.printers) {
        this.impresorasDisponibles = response.printers;
      }
    } catch (error: any) {
      console.error('Error cargando impresoras:', error);
      this.toast.error('Error', 'No se pudieron cargar las impresoras disponibles');
    } finally {
      this.cargandoImpresoras = false;
    }
  }

  async guardarConfiguracion() {
    try {
      // Guardar también en localStorage como respaldo
      localStorage.setItem('configImpresoraPOS', JSON.stringify(this.configImpresora));
      
      // Guardar en el backend
      await this.printerService.savePrinterConfig(this.configImpresora).toPromise();
      
      // Agregar al historial
      this.agregarHistorial('Configuración', true, 'Configuración guardada exitosamente');
      
      this.toast.success('Configuración', 'Configuración guardada exitosamente');
    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      this.agregarHistorial('Configuración', false, `Error: ${error.message || 'Error al guardar configuración'}`);
      this.toast.error('Error', error.message || 'Error al guardar la configuración');
    }
  }

  async cargarConfiguracion() {
    try {
      // Intentar cargar desde el backend primero
      const response = await this.printerService.getPrinterConfig().toPromise();
      if (response?.success && response.config) {
        this.configImpresora = { ...this.configImpresora, ...response.config };
        // Sincronizar con localStorage
        localStorage.setItem('configImpresoraPOS', JSON.stringify(this.configImpresora));
        this.agregarHistorial('Configuración', true, 'Configuración cargada desde el servidor');
        return;
      }
      
      // Si no hay en el backend, cargar desde localStorage
      const configGuardada = localStorage.getItem('configImpresoraPOS');
      if (configGuardada) {
        this.configImpresora = { ...this.configImpresora, ...JSON.parse(configGuardada) };
        this.agregarHistorial('Configuración', true, 'Configuración cargada desde almacenamiento local');
      }
    } catch (error: any) {
      console.error('Error cargando configuración:', error);
      // Intentar cargar desde localStorage como respaldo
      try {
        const configGuardada = localStorage.getItem('configImpresoraPOS');
        if (configGuardada) {
          this.configImpresora = { ...this.configImpresora, ...JSON.parse(configGuardada) };
        }
      } catch (localError) {
        this.agregarHistorial('Configuración', false, 'Error al cargar configuración');
      }
    }
  }

  async probarImpresora() {
    try {
      this.toast.info('Verificando', 'Verificando estado de la impresora...');
      const response = await this.printerService.checkPrinterStatus().toPromise();
      
      if (response?.success) {
        this.estadoImpresora = response.status;
        
        if (this.estadoImpresora.online && this.estadoImpresora.papel) {
          this.agregarHistorial('Prueba', true, 'Impresora funcionando correctamente');
          this.toast.success('Impresora', 'Impresora funcionando correctamente');
        } else {
          const errores = [];
          if (!this.estadoImpresora.online) errores.push('desconectada');
          if (!this.estadoImpresora.papel) errores.push('sin papel');
          if (!this.estadoImpresora.energia) errores.push('sin energía');
          
          this.agregarHistorial('Prueba', false, `Problemas: ${errores.join(', ')}`);
          this.toast.error('Impresora', `Problemas: ${errores.join(', ')}`);
        }
      }
    } catch (error: any) {
      console.error('Error probando impresora:', error);
      this.estadoImpresora = {
        online: false,
        papel: false,
        energia: false,
        error: error.message
      };
      this.agregarHistorial('Prueba', false, `Error: ${error.message || 'Error al verificar impresora'}`);
      this.toast.error('Error', error.message || 'Error al verificar la impresora');
    }
  }

  async imprimirTicketPrueba() {
    try {
      this.toast.info('Imprimiendo', 'Enviando ticket de prueba a la impresora...');
      const response = await this.printerService.printTestTicket().toPromise();
      
      if (response?.success) {
        this.agregarHistorial('Ticket Prueba', true, 'Ticket de prueba enviado a la impresora');
        this.toast.success('Ticket de Prueba', 'Ticket de prueba enviado a la impresora');
      }
    } catch (error: any) {
      console.error('Error imprimiendo ticket de prueba:', error);
      this.agregarHistorial('Ticket Prueba', false, `Error: ${error.message || 'Error al imprimir ticket'}`);
      this.toast.error('Error', error.message || 'Error al imprimir ticket de prueba');
    }
  }

  verificarEstadoImpresora() {
    // Verificar estado automáticamente cada 30 segundos si está en la pestaña de impresoras
    if (this.tabActivo === 'impresoras') {
      this.probarImpresora();
    }
  }

  agregarHistorial(tipo: string, exitoso: boolean, detalles: string) {
    const item = {
      fecha: new Date(),
      tipo: tipo,
      exitoso: exitoso,
      detalles: detalles
    };
    
    this.historialImpresion.unshift(item);
    
    // Mantener solo los últimos 50 items
    if (this.historialImpresion.length > 50) {
      this.historialImpresion = this.historialImpresion.slice(0, 50);
    }
  }

  // ===== FUNCIONES COMUNES =====
  async confirmarCambioEstado() {
    if (this.confirmacionData) {
      try {
        if (this.confirmacionData.tipo === 'eliminacion') {
          // Confirmar eliminación de rol
          const rol = this.confirmacionData.item;
          await this.supabase.eliminarRol(rol.id);
          this.roles = this.roles.filter(r => r.id !== rol.id);
          this.toast.success('Rol eliminado', `"${rol.nombre}" eliminado correctamente`);
        } else {
          // Confirmar cambio de estado
          const item = this.confirmacionData.item;
          const nuevoEstado = this.confirmacionData.nuevoEstado;
          
          if (this.confirmacionData.tipo === 'usuario') {
            // Actualizar estado del usuario
            await this.supabase.actualizarUsuario(item.id, { activo: nuevoEstado });
            item.activo = nuevoEstado;
            const mensaje = nuevoEstado ? 'activado' : 'desactivado';
            this.toast.info('Estado cambiado', `Usuario "${item.nombre}" ${mensaje}`);
            // Actualizar la lista en la vista
            this.usuariosFiltrados = [...this.usuarios];
          } else if (this.confirmacionData.tipo === 'rol') {
            // Actualizar estado del rol
            await this.supabase.actualizarRol(item.id, { activo: nuevoEstado });
            item.activo = nuevoEstado;
            const mensaje = nuevoEstado ? 'activado' : 'desactivado';
            this.toast.info('Estado cambiado', `Rol "${item.nombre}" ${mensaje}`);
          }
        }
        
        // Cerrar modal de confirmación
        this.cerrarConfirmacion();
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        this.toast.error('Error', 'No se pudo realizar la operación');
      }
    }
  }

  cerrarConfirmacion(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-confirmacion-config');
    }
    this.mostrarConfirmacion = false;
    this.confirmacionData = null;
  }

  async eliminarUsuario(usuario: any) {
    if (confirm(`¿Está seguro de que desea eliminar al usuario "${usuario.nombre}"?`)) {
      try {
        await this.supabase.eliminarUsuario(usuario.id);
        // Eliminar el usuario de la lista
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
        this.usuariosFiltrados = [...this.usuarios];
        this.toast.success('Usuario eliminado', `"${usuario.nombre}" eliminado correctamente`);
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        this.toast.error('Error', 'No se pudo eliminar el usuario');
      }
    }
  }

  obtenerEtiquetaRol(rol: string): string {
    const rolesMap: { [key: string]: string } = {
      'admin': 'Administrador',
      'gerente': 'Gerente',
      'cajero': 'Cajero',
      'cocina': 'Cocina',
      'vendedor': 'Vendedor',
      'usuario': 'Usuario'
    };
    return rolesMap[rol] || rol;
  }

  private abrirModalConfirmacion(): void {
    this.modalHistoryManager.registerModalOpen('modal-confirmacion-config', this.mostrarConfirmacion);
    this.mostrarConfirmacion = true;
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-usuario':
        this.cerrarModalUsuario(true);
        break;
      case 'modal-rol':
        this.cerrarModalRol(true);
        break;
      case 'modal-confirmacion-config':
        this.cerrarConfirmacion(true);
        break;
      default:
        if (modalId.startsWith('tab-config-')) {
          const tab = modalId.replace('tab-config-', '');
          this.cambiarTab(tab, true);
        }
        break;
    }
  }
}
