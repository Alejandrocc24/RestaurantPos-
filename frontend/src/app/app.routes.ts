import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MesasComponent } from './mesas/mesas.component';
import { VentasComponent } from './ventas/ventas.component';
import { CocinaComponent } from './cocina/cocina.component';
import { ProductosComponent } from './productos/productos.component';
import { GastosComponent } from './gastos/gastos.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { CategoriaGastosComponent } from './categoria-gastos/categoria-gastos.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { RespaldoComponent } from './respaldo/respaldo.component';

import { AuthGuard } from './guards/auth.guard';
import { LoginRedirectGuard } from './guards/login-redirect.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [LoginRedirectGuard] },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'mesas', component: MesasComponent },
      { path: 'ventas', component: VentasComponent },
      { path: 'cocina', component: CocinaComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'gastos', component: GastosComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'categorias-gastos', component: CategoriaGastosComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'usuarios', component: UsuariosComponent },
      { path: 'respaldo', component: RespaldoComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
