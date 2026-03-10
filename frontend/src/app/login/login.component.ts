// login.component.ts
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

  // Soporte para login de desarrollador multi-tenant
  isDevEmail: boolean = false;
  devTenantId: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  /**
   * Alternar la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Detecta si el email es del desarrollador (@dev)
   * para mostrar el campo de selección de tenant
   */
  onEmailChange(): void {
    const email = this.email.trim().toLowerCase();
    this.isDevEmail = email.endsWith('@dev');
  }

  /**
   * Extraer tenantId automáticamente del dominio del email
   */
  private extractTenantFromEmail(email: string): string {
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }
    const domain = email.split('@')[1]?.toLowerCase().trim();
    return domain || '';
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.email || !this.password) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa todos los campos',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Si es dev, validar que ingresó un tenant
    if (this.isDevEmail && !this.devTenantId.trim()) {
      Swal.fire({
        title: 'Tenant requerido',
        text: 'Como desarrollador, debes especificar a qué tenant conectarte',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.isLoading = true;

    try {
      const emailTrimmed = this.email.trim();
      if (!emailTrimmed.includes('@')) {
        Swal.fire({
          title: 'Email inválido',
          text: 'Por favor ingresa un email válido con formato usuario@negocio',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        this.isLoading = false;
        return;
      }

      // Determinar tenantId:
      // - Si es dev (@dev): usar el tenantId explícito del campo
      // - Si es usuario normal: extraer del dominio del email
      let tenantId: string;
      if (this.isDevEmail) {
        tenantId = this.devTenantId.trim().toLowerCase();
        console.log('🔐 [LoginComponent] Login como DESARROLLADOR');
        console.log('  - Email:', emailTrimmed);
        console.log('  - Tenant explícito:', tenantId);
      } else {
        tenantId = this.extractTenantFromEmail(emailTrimmed);
        console.log('🔐 [LoginComponent] Login como usuario normal');
        console.log('  - Email:', emailTrimmed);
        console.log('  - Tenant (del email):', tenantId);
      }

      // Llamar a AuthService - envía tenantId en el body
      const result = await this.authService.signIn(emailTrimmed, this.password, tenantId);

      if (result.success) {
        console.log('✅ [LoginComponent] Login exitoso, redirigiendo...');
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
        Swal.fire({
          title: 'Acceso Denegado',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p style="margin-bottom: 10px;"><strong>No se pudo iniciar sesión</strong></p>
              <p style="color: #666; font-size: 14px;">Las credenciales ingresadas no son válidas. Por favor verifica:</p>
              <ul style="text-align: left; color: #666; font-size: 14px; margin-top: 10px;">
                <li>Tu correo electrónico</li>
                <li>Tu contraseña</li>
                <li>Que tu cuenta esté activa</li>
                ${this.isDevEmail ? '<li>Que el tenant especificado sea correcto</li>' : ''}
              </ul>
              <p style="color: #666; font-size: 12px; margin-top: 10px;">${result.error || ''}</p>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Intentar nuevamente',
          confirmButtonColor: '#667eea',
          width: '450px'
        });
      }
    } catch (error: any) {
      console.error('❌ [LoginComponent] Error en login:', error);
      Swal.fire({
        title: 'Error de Conexión',
        html: `
          <div style="text-align: left; padding: 10px;">
            <p style="margin-bottom: 10px;"><strong>No se pudo conectar con el servidor</strong></p>
            <p style="color: #666; font-size: 14px;">Por favor verifica:</p>
            <ul style="text-align: left; color: #666; font-size: 14px; margin-top: 10px;">
              <li>Tu conexión a internet</li>
              <li>Que el servidor esté en funcionamiento</li>
              <li>Contacta al administrador si el problema persiste</li>
            </ul>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        width: '450px'
      });
    } finally {
      this.isLoading = false;
    }
  }
}
