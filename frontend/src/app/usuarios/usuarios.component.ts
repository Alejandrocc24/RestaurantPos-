import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../services/usuarios.service';
import { ToastService } from '../shared/toast/toast.service';
import { Usuario } from '../types/api.models';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  nuevoUsuario: any = {
    nombre: '',
    email: '',
    rol: 'usuario',
    activo: true
  };
  editandoUsuario: any = null;
  modoEdicion: boolean = false;
  mostrarFormularioNuevo: boolean = false;
  cargando: boolean = false;
  guardando: boolean = false;

  roles = [
    { valor: 'admin', etiqueta: 'Administrador' },
    { valor: 'gerente', etiqueta: 'Gerente' },
    { valor: 'cajero', etiqueta: 'Cajero' },
    { valor: 'cocina', etiqueta: 'Cocina' },
    { valor: 'usuario', etiqueta: 'Usuario' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private usuariosService: UsuariosService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuariosService.getUsuarios(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error cargando usuarios:', error);
          this.toastService.error('Error al cargar usuarios');
          this.cargando = false;
        }
      });
  }

  agregarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email) {
      this.toastService.warning('Por favor completa todos los campos');
      return;
    }

    this.guardando = true;
    this.usuariosService.createUsuario(this.nuevoUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarioCreado) => {
          if (usuarioCreado) {
            this.usuarios.push(usuarioCreado);
            this.toastService.success('Usuario creado exitosamente');
            this.ocultarFormulario();
          }
          this.guardando = false;
        },
        error: (error) => {
          console.error('Error creando usuario:', error);
          this.toastService.error('Error al crear usuario');
          this.guardando = false;
        }
      });
  }

  editarUsuario(usuario: Usuario): void {
    this.editandoUsuario = { ...usuario };
    this.modoEdicion = true;
  }

  guardarEdicion(): void {
    if (!this.editandoUsuario || !this.editandoUsuario.id) {
      return;
    }

    this.guardando = true;
    this.usuariosService.updateUsuario(this.editandoUsuario.id, this.editandoUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarioActualizado) => {
          if (usuarioActualizado) {
            const index = this.usuarios.findIndex(u => u.id === this.editandoUsuario.id);
            if (index !== -1) {
              this.usuarios[index] = usuarioActualizado;
            }
            this.toastService.success('Usuario actualizado exitosamente');
            this.cancelarEdicion();
          }
          this.guardando = false;
        },
        error: (error) => {
          console.error('Error actualizando usuario:', error);
          this.toastService.error('Error al actualizar usuario');
          this.guardando = false;
        }
      });
  }

  cancelarEdicion(): void {
    this.editandoUsuario = null;
    this.modoEdicion = false;
  }

  eliminarUsuario(usuario: Usuario): void {
    if (!usuario.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Eliminar a ${usuario.nombre || usuario.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.guardando = true;
        this.usuariosService.deleteUsuario(usuario.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (eliminado) => {
              if (eliminado) {
                this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
                this.toastService.success('Usuario eliminado exitosamente');
              }
              this.guardando = false;
            },
            error: (error) => {
              console.error('Error eliminando usuario:', error);
              this.toastService.error('Error al eliminar usuario');
              this.guardando = false;
            }
          });
      }
    });
  }

  cambiarEstadoUsuario(usuario: Usuario): void {
    if (!usuario.id) return;

    const nuevoEstado = !usuario.activo;
    this.usuariosService.updateEstadoUsuario(usuario.id, nuevoEstado)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarioActualizado) => {
          if (usuarioActualizado) {
            const index = this.usuarios.findIndex(u => u.id === usuario.id);
            if (index !== -1) {
              this.usuarios[index].activo = nuevoEstado;
            }
            this.toastService.success(
              `Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`
            );
          }
        },
        error: (error) => {
          console.error('Error cambiando estado:', error);
          this.toastService.error('Error al cambiar estado del usuario');
        }
      });
  }

  mostrarFormulario(): void {
    this.mostrarFormularioNuevo = true;
  }

  ocultarFormulario(): void {
    this.mostrarFormularioNuevo = false;
    this.limpiarFormulario();
  }

  limpiarFormulario(): void {
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      rol: 'usuario',
      activo: true
    };
  }

  obtenerRolEtiqueta(rol: string): string {
    const rolEncontrado = this.roles.find(r => r.valor === rol);
    return rolEncontrado ? rolEncontrado.etiqueta : rol;
  }
}
