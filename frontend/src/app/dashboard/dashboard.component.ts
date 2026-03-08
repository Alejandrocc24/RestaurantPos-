import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ProductosComponent } from '../productos/productos.component';
import { CategoriaProductosComponent } from '../productos/categoria-productos/categoria-productos.component';
import { GruposModificadoresComponent } from '../productos/grupos-modificadores/grupos-modificadores.component';
import { GestionComentariosComponent } from '../productos/gestion-comentarios/gestion-comentarios.component';
import { CocinaComponent } from '../cocina/cocina.component';
import { GastosComponent } from '../gastos/gastos.component';
import { ProveedoresComponent } from '../proveedores/proveedores.component';
import { CategoriaGastosComponent } from '../categoria-gastos/categoria-gastos.component';
import { ConfiguracionComponent } from '../configuracion/configuracion.component';
import { UsuariosComponent } from '../usuarios/usuarios.component';
import { RespaldoComponent } from '../respaldo/respaldo.component';
import { ToastContainerComponent } from '../shared/toast/toast-container.component';
import { MesasComponent } from '../mesas/mesas.component';
import { VentasComponent } from '../ventas/ventas.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ProductosComponent, CategoriaProductosComponent, GruposModificadoresComponent, GestionComentariosComponent, CocinaComponent, GastosComponent, ProveedoresComponent, CategoriaGastosComponent, ConfiguracionComponent, UsuariosComponent, RespaldoComponent, MesasComponent, VentasComponent, ToastContainerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentDate: string = '';
  currentTime: string = '';
  userName: string = 'usuario';
  userEmail: string = '';
  isSidebarVisible: boolean = false; // Controla la visibilidad del sidebar (cerrado por defecto)
  currentView: string = 'welcome'; // Controla qué componente mostrar
  private userSubscription: Subscription = new Subscription();
  private clockInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private permissions: PermissionsService
  ) {}

  ngOnInit() {
    // Restaurar sesión desde localStorage PRIMERO
    this.authService.restoreSession();
    this.permissions.refreshPermissions();

    this.updateDateTime();
    // Actualizar la fecha y hora cada segundo
    this.clockInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);

    // Sincronizar vista con los query params
    this.route.queryParams.subscribe(params => {
      const viewParam = params['view'] || 'mesas';
      this.showView(viewParam, false);
    });

    // Obtener información del usuario autenticado
    this.userSubscription = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.userName = user.nombre || user.email?.split('@')[0] || 'usuario';
        this.userEmail = user.email || '';
        console.log('Usuario autenticado:', this.userName, 'Rol:', user.rol);
      } else {
        // Solo redirigir al login si realmente no hay sesión después de intentar restaurar
        // Esperar un momento para dar tiempo a que se restaure la sesión
        setTimeout(() => {
          if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
          }
        }, 200);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateDateTime() {
    const now = new Date();
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    this.currentDate = `${days[now.getDay()]}`;
    
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // la hora '0' deberia ser '12'
    
    this.currentTime = `${hours.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${ampm}`;
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
    console.log('Sidebar visible:', this.isSidebarVisible); // Debug
  }

  showView(view: string, updateUrl: boolean = true): void {
    // Mapeo de vistas a módulos para verificar permisos
    const viewModuleMap: { [key: string]: string } = {
      'productos': 'productos',
      'categoria-productos': 'categorias',
      'grupos-modificadores': 'productos',
      'gestion-comentarios': 'productos',
      'inventario': 'productos',
      'ventas': 'ventas',
      'mesas': 'mesas',
      'cocina': 'cocina',
      'gastos': 'gastos',
      'proveedores': 'proveedores',
      'categoria-gastos': 'gastos',
      'configuracion': 'configuracion',
      'respaldo': 'configuracion'
    };

    const module = viewModuleMap[view];
    
    // Verificar permisos antes de cambiar vista
    if (module && !this.permissions.canAccessModule(module)) {
      Swal.fire({
        title: 'Acceso Denegado',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 10px;"><strong>No tienes permisos para acceder a este módulo</strong></p>
            <p style="color: #666; font-size: 14px;">Tu rol actual no tiene los permisos necesarios para ver esta sección.</p>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">Contacta al administrador si necesitas acceso.</p>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        width: '450px'
      });
      return;
    }

    if (this.currentView === view) {
      return;
    }

    this.currentView = view;
    console.log('Mostrando vista:', view, '- Módulo:', module);

    if (updateUrl) {
      this.router.navigate(['/dashboard'], {
        queryParams: { view }
      });
    }
  }

  async logout() {
    try {
      const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que quieres cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        // Limpiar permisos
        this.permissions.clearPermissions();
        await this.authService.signOut();
        // El AuthService ya maneja la redirección al login
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
