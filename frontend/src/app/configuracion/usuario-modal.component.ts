import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-usuario-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-modal.component.html',
  styleUrl: './usuario-modal.component.css'
})
export class UsuarioModalComponent implements OnInit {
  @Input() usuario: any = null;
  @Input() esEdicion: boolean = false;
  @Output() usuarioCreado = new EventEmitter<any>();
  @Output() usuarioEditado = new EventEmitter<any>();
  @Output() modalCerrado = new EventEmitter<void>();

  nombreUsuario: string = ''; // Parte antes de @dulcemomento
  
  nuevoUsuario: any = {
    nombre: '', // Este será nombreUsuario@dulcemomento
    nombreCompleto: '', // Nombre real de la persona
    email: '',
    rol: 'usuario',
    activo: true,
    password: '',
    confirmPassword: ''
  };

  cambiarPassword: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  roles: any[] = [];
  rolesDisponibles = [
    { valor: 'admin', etiqueta: 'Administrador' },
    { valor: 'gerente', etiqueta: 'Gerente' },
    { valor: 'cajero', etiqueta: 'Cajero' },
    { valor: 'cocina', etiqueta: 'Cocina' },
    { valor: 'vendedor', etiqueta: 'Vendedor' },
    { valor: 'usuario', etiqueta: 'Usuario' }
  ];

  errores: any = {};
  enviando = false;

  constructor(private supabase: SupabaseService) { }

  async ngOnInit() {
    // Cargar roles desde la base de datos
    await this.cargarRoles();
    
    if (this.esEdicion && this.usuario) {
      // Extraer el nombre de usuario del formato nombre@dulcemomento
      const nombreCompleto = this.usuario.nombre || '';
      if (nombreCompleto.includes('@dulcemomento')) {
        this.nombreUsuario = nombreCompleto.split('@')[0];
      } else {
        this.nombreUsuario = nombreCompleto;
      }
      
      // Si es edición, copiar los datos del usuario (sin contraseña)
      this.nuevoUsuario = {
        id: this.usuario.id,
        nombre: this.usuario.nombre,
        nombreCompleto: this.usuario.nombre_completo || this.usuario.nombreCompleto || '',
        email: this.usuario.email || '',
        rol: this.usuario.rol,
        activo: this.usuario.activo,
        password: '', // No mostrar contraseña en edición
        confirmPassword: ''
      };
      this.cambiarPassword = false; // Por defecto no cambiar contraseña
      this.showPassword = false;
      this.showConfirmPassword = false;
    }
  }

  actualizarNombreCompleto() {
    // Actualizar el nombre de usuario con el formato @dulcemomento
    if (this.nombreUsuario) {
      this.nuevoUsuario.nombre = `${this.nombreUsuario.toLowerCase().trim()}@dulcemomento`;
    } else {
      this.nuevoUsuario.nombre = '';
    }
  }

  async cargarRoles() {
    try {
      const rolesDB = await this.supabase.getRoles({ incluirInactivos: false });
      // Mapear roles de la base de datos
      this.roles = rolesDB.map((rol: any) => ({
        valor: rol.codigo || rol.nombre.toLowerCase(),
        etiqueta: rol.nombre
      }));
      
      // Si no hay roles en la BD, usar los predefinidos
      if (this.roles.length === 0) {
        this.roles = this.rolesDisponibles;
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
      // Usar roles predefinidos como fallback
      this.roles = this.rolesDisponibles;
    }
  }

  validarFormulario(): boolean {
    this.errores = {};

    // Validar nombre de usuario
    if (!this.nombreUsuario.trim()) {
      this.errores.nombreUsuario = 'El nombre de usuario es obligatorio';
    } else if (!/^[a-zA-Z0-9_]+$/.test(this.nombreUsuario)) {
      this.errores.nombreUsuario = 'Solo letras, números y guión bajo';
    }

    // Validar nombre completo
    if (!this.nuevoUsuario.nombreCompleto.trim()) {
      this.errores.nombreCompleto = 'El nombre completo es obligatorio';
    }

    // Email es opcional, pero si se proporciona debe ser válido
    if (this.nuevoUsuario.email && this.nuevoUsuario.email.trim()) {
      if (!this.validarEmail(this.nuevoUsuario.email)) {
        this.errores.email = 'El email no es válido';
      }
    }

    // Validar contraseña solo si es un usuario nuevo O si se quiere cambiar en edición
    if (!this.esEdicion || this.cambiarPassword) {
      if (!this.nuevoUsuario.password) {
        this.errores.password = 'La contraseña es obligatoria';
      } else if (this.nuevoUsuario.password.length < 6) {
        this.errores.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (this.nuevoUsuario.password !== this.nuevoUsuario.confirmPassword) {
        this.errores.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    return Object.keys(this.errores).length === 0;
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async guardarUsuario(): Promise<void> {
    // Actualizar el nombre antes de validar
    this.actualizarNombreCompleto();
    
    if (!this.validarFormulario()) {
      return;
    }

    this.enviando = true;

    try {
      if (this.esEdicion) {
        // Editar usuario existente
        const usuarioEditado: any = {
          id: this.nuevoUsuario.id,
          nombre: this.nuevoUsuario.nombre, // formato: usuario@dulcemomento
          nombre_completo: this.nuevoUsuario.nombreCompleto,
          email: this.nuevoUsuario.email || null,
          rol: this.nuevoUsuario.rol,
          activo: this.nuevoUsuario.activo
        };
        
        // Solo incluir password si se cambió
        if (this.cambiarPassword && this.nuevoUsuario.password) {
          usuarioEditado.password = this.nuevoUsuario.password;
        }
        
        this.usuarioEditado.emit(usuarioEditado);
      } else {
        // Crear nuevo usuario
        const usuario = {
          nombre: this.nuevoUsuario.nombre, // formato: usuario@dulcemomento
          nombre_completo: this.nuevoUsuario.nombreCompleto,
          email: this.nuevoUsuario.email || null,
          password: this.nuevoUsuario.password,
          rol: this.nuevoUsuario.rol,
          activo: this.nuevoUsuario.activo
        };
        this.usuarioCreado.emit(usuario);
      }
      
      // Limpiar formulario y cerrar modal
      this.limpiarFormulario();
      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    } finally {
      this.enviando = false;
    }
  }

  limpiarFormulario(): void {
    this.nombreUsuario = '';
    this.nuevoUsuario = {
      nombre: '',
      nombreCompleto: '',
      email: '',
      rol: 'usuario',
      activo: true,
      password: '',
      confirmPassword: ''
    };
    this.cambiarPassword = false;
    this.errores = {};
  }

  cerrarModal(): void {
    this.modalCerrado.emit();
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  // Método para compatibilidad con el nombre anterior
  async crearUsuario(): Promise<void> {
    await this.guardarUsuario();
  }
}
