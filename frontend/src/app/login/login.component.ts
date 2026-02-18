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
  tenantId: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  // Tenants disponibles en el sistema
  availableTenants = [
    { id: 'dulcemomento', name: 'Dulce Momento' },
    { id: 'buenosaires', name: 'Buenos Aires' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Preseleccionar el primer tenant
    this.tenantId = this.availableTenants[0]?.id || '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Detectar tenantId desde el email si tiene dominio reconocido
   */
  detectTenantFromEmail(): void {
    if (!this.email.includes('@')) {
      return;
    }

    const domain = this.email.split('@')[1]?.toLowerCase().trim();
    const foundTenant = this.availableTenants.find(t => 
      t.id === domain || t.id === domain.replace('_', '')
    );

    if (foundTenant) {
      this.tenantId = foundTenant.id;
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.email || !this.password || !this.tenantId) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa todos los campos incluyendo el tenant',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.isLoading = true;

    try {
      // Validar email
      const emailTrimmed = this.email.trim();
      if (!emailTrimmed.includes('@')) {
        Swal.fire({
          title: 'Email inválido',
          text: 'Por favor ingresa un email válido',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        this.isLoading = false;
        return;
      }

      console.log('🔐 [LoginComponent] Intentando login...');
      console.log('  - Email:', emailTrimmed);
      console.log('  - TenantId:', this.tenantId);

      // Llamar a AuthService con el nuevo formato
      const result = await this.authService.signIn(emailTrimmed, this.password, this.tenantId);
      
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
                <li>Que hayas seleccionado el tenant correcto</li>
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
              <li>Que el servidor esté en funcionamiento en: http://localhost:3000</li>
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
