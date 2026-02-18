import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  name: string;
  icon: string;
  route: string;
  view: string;
  requiredPermission?: string;
  visible?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = true;
  @Output() closeRequested = new EventEmitter<void>();
  @Output() viewChangeRequested = new EventEmitter<string>();
  
  private userSubscription: Subscription = new Subscription();
  
  allMenuItems: MenuItem[] = [
    // === OPERACIONES PRINCIPALES ===
    { 
      name: 'Mesas', 
      icon: '🪑', 
      route: '/mesas', 
      view: 'mesas',
      requiredPermission: 'mesas.ver'
    },
    { 
      name: 'Ventas', 
      icon: '💰', 
      route: '/ventas', 
      view: 'ventas',
      requiredPermission: 'ventas.ver'
    },
    { 
      name: 'Cocina', 
      icon: '👨‍🍳', 
      route: '/cocina', 
      view: 'cocina',
      requiredPermission: 'cocina.ver'
    },
    
    // === GESTIÓN DE PRODUCTOS ===
    { 
      name: 'Productos', 
      icon: '🍦', 
      route: '/productos', 
      view: 'productos',
      requiredPermission: 'productos.ver'
    },
    
    // === FINANZAS ===
    { 
      name: 'Gastos', 
      icon: '📊', 
      route: '/gastos', 
      view: 'gastos',
      requiredPermission: 'gastos.ver'
    },
    
    // === ADMINISTRACIÓN ===
    { 
      name: 'Configuración', 
      icon: '⚙️', 
      route: '/configuracion', 
      view: 'configuracion',
      requiredPermission: 'configuracion.ver'
    },
    { 
      name: 'Respaldo y Restauración', 
      icon: '💾', 
      route: '/respaldo', 
      view: 'respaldo',
      requiredPermission: 'configuracion.ver'
    }
  ];

  // Items visibles según permisos
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private permissions: PermissionsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateVisibleMenuItems();
    
    // Actualizar menú cuando cambie el usuario
    this.userSubscription = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.permissions.refreshPermissions();
        this.updateVisibleMenuItems();
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  updateVisibleMenuItems() {
    // Filtrar items según permisos del usuario
    this.menuItems = this.allMenuItems.filter(item => {
      if (!item.requiredPermission) {
        return true; // Si no requiere permiso, siempre visible
      }
      return this.permissions.hasPermission(item.requiredPermission);
    });
    
    console.log('Items de menú visibles:', this.menuItems.length, 'de', this.allMenuItems.length);
  }

  navigateTo(route: string): void {
    // Buscar el item del menú
    const menuItem = this.menuItems.find(item => item.route === route);
    if (menuItem) {
      console.log('Navegando a:', route, 'Vista:', menuItem.view);
      // Emitir el cambio de vista
      this.viewChangeRequested.emit(menuItem.view);
      // Cerrar el sidebar después de la selección
      this.closeSidebar();
    }
  }

  closeSidebar(): void {
    this.closeRequested.emit();
  }
}
