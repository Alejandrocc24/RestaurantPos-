import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TopnavComponent } from '../topnav/topnav.component';
import { AuthService } from '../services/auth.service';
import { ZonaService } from '../services/zona.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, TopnavComponent]
})
export class LayoutComponent implements OnInit, OnDestroy {
  breadcrumb = 'Dashboard';
  currentTime = '';
  businessName = 'RestaurantPOS';
  userName = 'Usuario';
  showZonaSubnav = false;
  zonaActiva = 'salon';
  modoEdicion = false;
  filtroActivo = 'todas';
  dropdownOpen = false;
  zonasDisponibles: string[] = [];

  private routerSub?: Subscription;
  private userSub?: Subscription;
  private salonesSub?: Subscription;
  private clockInterval?: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private zonaService: ZonaService
  ) {}

  ngOnInit(): void {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumb();
      this.updateSubnav();
    });
    this.updateBreadcrumb();
    this.updateSubnav();

    this.updateTime();
    this.clockInterval = setInterval(() => this.updateTime(), 60000);

    this.userSub = this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.userName = user.nombre || user.email?.split('@')[0] || 'Usuario';
      }
    });

    this.zonaService.modoEdicion$.subscribe(value => {
      this.modoEdicion = value;
    });

    this.zonaService.filtro$.subscribe(value => {
      this.filtroActivo = value;
    });

    this.salonesSub = this.zonaService.salones$.subscribe(() => {
      this.zonasDisponibles = this.zonaService.getZonasDisponibles();
    });
    this.zonasDisponibles = this.zonaService.getZonasDisponibles();

    this.loadBusinessName();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.salonesSub?.unsubscribe();
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private updateSubnav(): void {
    const url = this.router.url.split('?')[0];
    this.showZonaSubnav = url === '/mesas';
    if (this.showZonaSubnav) {
      this.zonaActiva = this.zonaService.getZona();
    }
  }

  setZona(zona: string): void {
    this.zonaActiva = zona;
    this.zonaService.setZona(zona);
  }

  toggleModoEdicion(): void {
    this.zonaService.toggleModoEdicion();
  }

  setFiltro(filtro: string): void {
    this.zonaService.setFiltro(filtro);
    this.dropdownOpen = false;
  }

  abrirGestionarSalones(): void {
    this.zonaService.abrirGestionarSalones();
  }

  abrirNuevaMesa(): void {
    this.zonaService.abrirNuevaMesa();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.dropdownOpen = false;
  }

  private updateBreadcrumb(): void {
    const url = this.router.url.split('?')[0];
    const map: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/mesas': 'Mesas',
      '/ventas': 'Ventas / POS',
      '/cocina': 'Cocina',
      '/productos': 'Productos',
      '/gastos': 'Gastos',
      '/proveedores': 'Proveedores',
      '/categorias-gastos': 'Categorías Gastos',
      '/configuracion': 'Configuración',
      '/usuarios': 'Usuarios',
      '/respaldo': 'Respaldo'
    };
    this.breadcrumb = map[url] || 'Dashboard';
  }

  private updateTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.currentTime = `${hours}:${minutes}`;
  }

  private loadBusinessName(): void {
    if (typeof window === 'undefined') return;
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId && tenantId !== 'dev') {
      this.businessName = tenantId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }
}
