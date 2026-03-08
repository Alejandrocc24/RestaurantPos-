import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../shared/toast/toast.service';
import { BackupService, BackupMetadata } from '../services/backup.service';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-respaldo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './respaldo.component.html',
  styleUrls: ['./respaldo.component.css']
})
export class RespaldoComponent implements OnInit, OnDestroy {
  // Propiedades para el modal de respaldo
  tabActivo: string = 'respaldo';
  private tabHistory: string[] = [this.tabActivo];

  private modalHistoryManager: ModalHistoryManager;

  // Datos del formulario de respaldo
  opcionesRespaldo = {
    baseDatos: true,
    archivos: false,
    subirADrive: true
  };
  nombreRespaldo: string = '';
  descripcionRespaldo: string = '';

  // Datos de restauracion
  archivoSeleccionado: File | null = null;
  confirmarRestauracion: boolean = false;

  // Estados de carga
  creandoRespaldo: boolean = false;
  restaurandoRespaldo: boolean = false;
  cargandoHistorial: boolean = false;
  borrandoDatos: boolean = false;

  // Confirmaciones
  confirmarBorrado: boolean = false;

  // Progreso
  progresoOperacion: number = 0;
  mensajeProgreso: string = '';

  // Historial de respaldos
  historialRespaldos: BackupMetadata[] = [];

  constructor(
    private toast: ToastService,
    private backupService: BackupService
  ) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'respaldo-base');
  }

  ngOnInit() {
    this.cargarHistorial();
    this.generarNombreAutomatico();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  generarNombreAutomatico(): void {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    // Contar respaldos del día actual
    const respaldosHoy = this.historialRespaldos.filter(r => {
      if (!r.fecha) return false;
      const fechaRespaldo = new Date(r.fecha);
      return fechaRespaldo.getDate() === fecha.getDate() &&
        fechaRespaldo.getMonth() === fecha.getMonth() &&
        fechaRespaldo.getFullYear() === fecha.getFullYear();
    }).length;

    const numero = String(respaldosHoy + 1).padStart(3, '0');
    this.nombreRespaldo = `Respaldo_${año}_${mes}_${dia}_${hora}${minutos}_${numero}`;
  }

  cambiarTab(tab: string, desdeHistorial = false): void {
    if (!desdeHistorial && this.tabActivo === tab) {
      return;
    }

    if (desdeHistorial) {
      if (this.tabHistory.length > 1) {
        this.tabHistory.pop();
        this.tabActivo = this.tabHistory[this.tabHistory.length - 1];
      } else {
        this.tabActivo = this.tabHistory[0] || 'respaldo';
      }
      return;
    }

    this.modalHistoryManager.registerModalOpen(`tab-respaldo-${tab}`, false);
    this.tabHistory.push(tab);
    this.tabActivo = tab;
  }

  resetFormularioRespaldo(): void {
    this.opcionesRespaldo = {
      baseDatos: true,
      archivos: false,
      subirADrive: true
    };
    this.nombreRespaldo = '';
    this.descripcionRespaldo = '';
    this.archivoSeleccionado = null;
    this.confirmarRestauracion = false;
    this.progresoOperacion = 0;
    this.mensajeProgreso = '';
  }

  cargarHistorial(): void {
    this.cargandoHistorial = true;
    this.backupService.listBackups().subscribe({
      next: (response) => {
        if (response.success && response.respaldos) {
          this.historialRespaldos = response.respaldos;
          // Regenerar nombre automático después de cargar historial
          this.generarNombreAutomatico();
        }
        this.cargandoHistorial = false;
      },
      error: (error) => {
        console.error('Error cargando historial:', error);
        this.toast.error('Error', 'No se pudo cargar el historial de respaldos');
        this.cargandoHistorial = false;
      }
    });
  }

  crearRespaldo(): void {
    if (!this.nombreRespaldo.trim()) {
      this.toast.warning('Validación', 'Por favor, ingresa un nombre para el respaldo');
      return;
    }

    if (!this.opcionesRespaldo.baseDatos && !this.opcionesRespaldo.archivos) {
      this.toast.warning('Validación', 'Debes seleccionar al menos una opción de respaldo');
      return;
    }

    this.creandoRespaldo = true;
    this.progresoOperacion = 0;
    this.mensajeProgreso = 'Iniciando respaldo...';

    // Simular progreso
    const progresoInterval = setInterval(() => {
      if (this.progresoOperacion < 90) {
        this.progresoOperacion += 10;
      }
    }, 500);

    this.backupService.createBackup(
      this.nombreRespaldo,
      this.descripcionRespaldo,
      this.opcionesRespaldo
    ).subscribe({
      next: (response) => {
        clearInterval(progresoInterval);
        this.progresoOperacion = 100;
        this.mensajeProgreso = 'Respaldo completado';

        if (response.success) {
          this.toast.success('Respaldo creado', response.message || 'El respaldo fue creado exitosamente');

          // Recargar historial
          this.cargarHistorial();

          // Mostrar información del respaldo
          if (response.backup?.google_drive_url) {
            this.toast.info('Google Drive', 'Respaldo guardado en Google Drive');
          }
        } else {
          this.toast.error('Error', response.error || 'No se pudo crear el respaldo');
        }

        this.creandoRespaldo = false;
        setTimeout(() => {
          this.resetFormularioRespaldo();
          this.cambiarTab('historial');
        }, 2000);
      },
      error: (error) => {
        clearInterval(progresoInterval);
        console.error('Error creando respaldo:', error);
        this.toast.error('Error', error.error || 'Error al crear el respaldo');
        this.creandoRespaldo = false;
        this.progresoOperacion = 0;
        this.mensajeProgreso = '';
      }
    });
  }

  obtenerTipoRespaldo(): string {
    const opciones = [];
    if (this.opcionesRespaldo.baseDatos) opciones.push('DB');
    if (this.opcionesRespaldo.archivos) opciones.push('Archivos');


    if (opciones.length === 3) return 'Completo';
    if (opciones.length === 1) return opciones[0];
    return opciones.join(' + ');
  }

  seleccionarArchivo(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      console.log('Archivo seleccionado:', file.name);
    }
  }

  restaurarRespaldo(): void {
    if (!this.archivoSeleccionado) {
      this.toast.warning('Validación', 'Por favor, selecciona un archivo de respaldo');
      return;
    }

    if (!this.confirmarRestauracion) {
      this.toast.warning('Confirmación requerida', 'Debes confirmar que entiendes los riesgos de la restauración');
      return;
    }

    this.restaurandoRespaldo = true;
    this.progresoOperacion = 0;
    this.mensajeProgreso = 'Restaurando datos...';

    // Simular progreso
    const progresoInterval = setInterval(() => {
      if (this.progresoOperacion < 90) {
        this.progresoOperacion += 5;
      }
    }, 800);

    this.backupService.restoreBackup(this.archivoSeleccionado).subscribe({
      next: (response) => {
        clearInterval(progresoInterval);
        this.progresoOperacion = 100;
        this.mensajeProgreso = 'Restauración completada';

        if (response.success) {
          const resultados = response.resultados;
          const mensaje = `Restauración completada: ${resultados?.total_registros || 0} registros restaurados`;

          this.toast.success('Restauración exitosa', mensaje);

          if (resultados?.tablas_con_errores && resultados.tablas_con_errores.length > 0) {
            this.toast.warning('Advertencia', `${resultados.tablas_con_errores.length} tablas con errores`);
          }

          // Recargar historial
          setTimeout(() => {
            this.cargarHistorial();
            this.resetFormularioRespaldo();
          }, 2000);
        } else {
          this.toast.error('Error', response.error || 'No se pudo restaurar el respaldo');
        }

        this.restaurandoRespaldo = false;
      },
      error: (error) => {
        clearInterval(progresoInterval);
        console.error('Error restaurando:', error);
        this.toast.error('Error', error.error || 'Error al restaurar el respaldo');
        this.restaurandoRespaldo = false;
        this.progresoOperacion = 0;
        this.mensajeProgreso = '';
      }
    });
  }

  descargarRespaldo(respaldo: BackupMetadata): void {
    if (!respaldo.id) return;

    this.toast.info('Descarga', `Descargando respaldo: ${respaldo.nombre}`);
    this.backupService.downloadBackupAsFile(respaldo.id, respaldo.nombre);
  }

  abrirEnGoogleDrive(respaldo: BackupMetadata): void {
    if (!respaldo.id) return;

    if (respaldo.google_drive_url) {
      window.open(respaldo.google_drive_url, '_blank');
    } else {
      this.backupService.openInGoogleDrive(respaldo.id);
    }
  }

  restaurarDesdeHistorial(respaldo: BackupMetadata): void {
    if (!respaldo.id) return;

    Swal.fire({
      title: '¿Restaurar sistema?',
      text: `¿Estás seguro de que quieres restaurar desde "${respaldo.nombre}"? Esta acción sobrescribirá todos los datos actuales.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.restaurandoRespaldo = true;
        this.progresoOperacion = 0;
        this.mensajeProgreso = 'Restaurando desde historial...';

        const progresoInterval = setInterval(() => {
          if (this.progresoOperacion < 90) {
            this.progresoOperacion += 5;
          }
        }, 800);

        this.backupService.restoreFromHistory(respaldo.id!).subscribe({
          next: (response) => {
            clearInterval(progresoInterval);
            this.progresoOperacion = 100;
            this.mensajeProgreso = 'Restauración completada';

            if (response.success) {
              this.toast.success('Restauración exitosa', 'Datos restaurados correctamente');
              setTimeout(() => {
                this.cargarHistorial();
                this.restaurandoRespaldo = false;
                this.progresoOperacion = 0;
                this.mensajeProgreso = '';
              }, 2000);
            } else {
              this.toast.error('Error', response.error || 'No se pudo restaurar');
              this.restaurandoRespaldo = false;
            }
          },
          error: (error) => {
            clearInterval(progresoInterval);
            console.error('Error restaurando:', error);
            this.toast.error('Error', 'Error al restaurar el respaldo');
            this.restaurandoRespaldo = false;
            this.progresoOperacion = 0;
            this.mensajeProgreso = '';
          }
        });
      }
    });
  }

  eliminarRespaldo(respaldo: BackupMetadata): void {
    if (!respaldo.id) return;

    Swal.fire({
      title: '¿Eliminar respaldo?',
      text: `¿Estás seguro de que quieres eliminar el respaldo "${respaldo.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.backupService.deleteBackup(respaldo.id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.toast.success('Eliminado', 'Respaldo eliminado exitosamente');
              this.cargarHistorial();
            } else {
              this.toast.error('Error', response.error || 'No se pudo eliminar');
            }
          },
          error: (error) => {
            console.error('Error eliminando:', error);
            this.toast.error('Error', 'Error al eliminar el respaldo');
          }
        });
      }
    });
  }

  wipeData(): void {
    if (!this.confirmarBorrado) {
      this.toast.warning('Confirmación requerida', 'Debes confirmar que entiendes los riesgos.');
      return;
    }

    Swal.fire({
      title: '¿Borrar TODOS los datos?',
      text: '¿Estás absolutamente seguro de que deseas borrar todos los datos de prueba? Esta acción no se puede deshacer.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.borrandoDatos = true;
        this.progresoOperacion = 0;
        this.mensajeProgreso = 'Borrando datos...';

        const progresoInterval = setInterval(() => {
          if (this.progresoOperacion < 90) {
            this.progresoOperacion += 10;
          }
        }, 500);

        this.backupService.wipeData().subscribe({
          next: (response) => {
            clearInterval(progresoInterval);
            this.progresoOperacion = 100;
            this.mensajeProgreso = 'Datos borrados exitosamente';

            if (response.success) {
              this.toast.success('Éxito', response.message || 'Datos borrados correctamente');
              setTimeout(() => {
                this.cambiarTab('historial');
                this.confirmarBorrado = false;
                this.borrandoDatos = false;
                this.progresoOperacion = 0;
                this.mensajeProgreso = '';
              }, 2000);
            } else {
              this.toast.error('Error', response.error || 'No se pudieron borrar todos los datos');
              this.borrandoDatos = false;
            }
          },
          error: (error) => {
            clearInterval(progresoInterval);
            console.error('Error borrando datos:', error);
            this.toast.error('Error', error.error || 'Ocurrió un error al borrar los datos');
            this.borrandoDatos = false;
            this.progresoOperacion = 0;
            this.mensajeProgreso = '';
          }
        });
      }
    });
  }

  private handleModalClose(modalId: string): void {
    if (modalId.startsWith('tab-respaldo-')) {
      const tab = modalId.replace('tab-respaldo-', '');
      this.cambiarTab(tab, true);
    }
  }
}
