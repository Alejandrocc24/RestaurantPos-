import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductosComponent } from './productos/productos.component';
import { GastosComponent } from './gastos/gastos.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';

import { AuthGuard } from './guards/auth.guard';
import { LoginRedirectGuard } from './guards/login-redirect.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [LoginRedirectGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },

  { path: 'productos', component: ProductosComponent, canActivate: [AuthGuard] },
  { path: 'gastos', component: GastosComponent, canActivate: [AuthGuard] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [AuthGuard] }
];
