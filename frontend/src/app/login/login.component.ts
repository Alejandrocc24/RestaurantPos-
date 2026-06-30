import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  errorMessage: string = '';

  isDevEmail: boolean = false;
  devTenantId: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onEmailChange(): void {
    const email = this.email.trim().toLowerCase();
    this.isDevEmail = email.endsWith('@dev');
    this.errorMessage = '';
  }

  private extractTenantFromEmail(email: string): string {
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }
    const domain = email.split('@')[1]?.toLowerCase().trim();
    return domain || '';
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.isDevEmail && !this.devTenantId.trim()) {
      this.errorMessage = 'Como desarrollador, debes especificar a qué tenant conectarte';
      return;
    }

    this.isLoading = true;

    try {
      const emailTrimmed = this.email.trim();
      if (!emailTrimmed.includes('@')) {
        this.errorMessage = 'Por favor ingresa un email válido con formato usuario@negocio';
        this.isLoading = false;
        return;
      }

      let tenantId: string;
      if (this.isDevEmail) {
        tenantId = this.devTenantId.trim().toLowerCase();
      } else {
        tenantId = this.extractTenantFromEmail(emailTrimmed);
      }

      const result = await this.authService.signIn(emailTrimmed, this.password, tenantId);

      if (result.success) {
        Swal.fire({
          title: '¡Bienvenido!',
          text: 'Inicio de sesión exitoso',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/dashboard'], { queryParams: { view: 'mesas' }, replaceUrl: true });
        });
      } else {
        this.errorMessage = result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.';
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } finally {
      this.isLoading = false;
    }
  }
}
