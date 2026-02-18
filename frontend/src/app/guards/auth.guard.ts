import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate() {
    // Verificar si hay token y el usuario está autenticado
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Si no está autenticado, redirigir a login
    this.router.navigate(['/login']);
    return false;
  }
}
