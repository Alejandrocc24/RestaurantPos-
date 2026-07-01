import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { PermissionsService } from '../services/permissions.service';
import { Observable, Subscription } from 'rxjs';
import { Usuario } from '../types/api.models';

interface MenuItem {
  name: string;
  icon: string;
  route: string;
  requiredPermission?: string;
}

interface MenuGroup {
  name: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-topnav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.css']
})
export class TopnavComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  horaActual = '';
  usuario$: Observable<Usuario | null>;


  private allItems: MenuItem[] = [
    { name: 'Mesas', icon: '🪑', route: '/mesas', requiredPermission: 'mesas.ver' },
    { name: 'Ventas', icon: '🧾', route: '/ventas', requiredPermission: 'ventas.ver' },
    { name: 'Cocina', icon: '👨‍🍳', route: '/cocina', requiredPermission: 'cocina.ver' },
    { name: 'Productos', icon: '📦', route: '/productos', requiredPermission: 'productos.ver' },
    { name: 'Gastos', icon: '💸', route: '/gastos', requiredPermission: 'gastos.ver' },
    { name: 'Configuración', icon: '⚙️', route: '/configuracion', requiredPermission: 'configuracion.ver' },
  ];

  private groupDefs: { name: string; keys: string[] }[] = [
    { name: 'OPERACIÓN', keys: ['Mesas', 'Ventas', 'Cocina'] },
    { name: 'ADMINISTRACIÓN', keys: ['Productos', 'Gastos'] },
    { name: 'SISTEMA', keys: ['Configuración'] },
  ];

  menuGroups: MenuGroup[] = [];
  private clockInterval?: any;
  private userSub?: Subscription;

  constructor(
    private authService: AuthService,
    private permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.usuario$ = this.authService.getCurrentUser();
    this.updateTime();
    this.clockInterval = setInterval(() => this.updateTime(), 60000);
    this.buildMenu();

    this.userSub = this.authService.getCurrentUser().subscribe(() => {
      this.permissions.refreshPermissions();
      this.buildMenu();
    });
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.userSub?.unsubscribe();
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    this.authService.signOut();
  }

  private buildMenu(): void {
    const visible = this.allItems.filter(item =>
      !item.requiredPermission || this.permissions.hasPermission(item.requiredPermission)
    );

    this.menuGroups = this.groupDefs.reduce((acc, group) => {
      const items = group.keys
        .map(key => visible.find(i => i.name === key))
        .filter((i): i is MenuItem => !!i);

      if (items.length > 0) {
        acc.push({ name: group.name, items });
      }
      return acc;
    }, [] as MenuGroup[]);
  }

  private updateTime(): void {
    const now = new Date();
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const dia = dias[now.getDay()];
    const fecha = `${dia} ${now.getDate()} de ${meses[now.getMonth()]}`;
    this.horaActual = `${hours}:${minutes} ${ampm} · ${fecha}`;
  }
}
