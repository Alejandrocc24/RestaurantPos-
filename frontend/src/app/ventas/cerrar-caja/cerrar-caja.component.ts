import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentasService, Caja, Recaudo, Gasto } from '../../services/ventas.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ModalHistoryManager } from '../../shared/utils/modal-history-manager';

@Component({
  selector: 'app-cerrar-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cerrar-caja.component.html',
  styleUrls: ['./cerrar-caja.component.css']
})
export class CerrarCajaComponent implements OnInit, OnDestroy {
  @Input() cajaId: string = '';
  @Input() recaudoActual: number = 0;
  @Input() gastosHoy: number = 0;
  @Input() pagosTransferencia: number = 0;
  @Input() pagosTarjeta: number = 0;
  @Input() pagosEfectivo: number = 0;
  @Input() montoInicial: number = 0;
  @Output() cajaCerrada = new EventEmitter<Caja>();

  mostrarModal: boolean = false;
  montoEfectivo: number = 0;
  montoTransferencia: number = 0;
  montoTarjeta: number = 0;
  observaciones: string = '';
  dineroEsperado: number = 0;
  diferencia: number = 0;

  private modalHistoryManager: ModalHistoryManager;

  constructor(private ventasService: VentasService, private toast: ToastService) {
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'cerrar-caja-base');
  }

  ngOnInit() {
    this.calcularDineroEsperado();
    this.actualizarMontosPago();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
  }

  ngOnChanges() {
    this.calcularDineroEsperado();
    this.actualizarMontosPago();
  }

  abrirModal() {
    this.modalHistoryManager.registerModalOpen('modal-cerrar-caja', this.mostrarModal);
    this.mostrarModal = true;
    this.calcularDineroEsperado();
  }

  cerrarModal(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-cerrar-caja');
    }
    this.mostrarModal = false;
    this.limpiarFormulario();
  }

  calcularDineroEsperado() {
    // Dinero esperado en caja = Monto inicial + Ventas en efectivo - Gastos del día
    // Solo contamos el efectivo, no transferencias ni tarjetas
    this.dineroEsperado = this.montoInicial + this.pagosEfectivo - this.gastosHoy;
    
    // Si hay diferencia, calcularla
    if (this.montoEfectivo > 0) {
      this.diferencia = this.montoEfectivo - this.dineroEsperado;
    }
  }

  actualizarMontosPago() {
    this.montoTransferencia = this.pagosTransferencia;
    this.montoTarjeta = this.pagosTarjeta;
  }

  onMontoEfectivoChange() {
    this.calcularDineroEsperado();
  }

  confirmarCierre() {
    if (this.montoEfectivo <= 0) {
      this.toast.warning('Validación', 'Debe ingresar el monto de efectivo en caja');
      return;
    }

    const cajaCerrada: Caja = {
      id: this.cajaId,
      estado: 'cerrada',
      fechaApertura: new Date().toISOString(),
      fechaCierre: new Date().toISOString(),
      montoInicial: this.montoInicial,
      montoFinal: this.montoEfectivo,
      usuarioApertura: 'admin',
      usuarioCierre: 'admin',
      observaciones: this.observaciones
    };

    (async () => {
      await this.ventasService.cerrarCaja(this.cajaId);
      this.cajaCerrada.emit(cajaCerrada);
      this.toast.success('Caja cerrada', 'La caja fue cerrada exitosamente');
      this.cerrarModal();
    })();
  }

  limpiarFormulario() {
    this.montoEfectivo = 0;
    this.montoTransferencia = 0;
    this.montoTarjeta = 0;
    this.observaciones = '';
    this.diferencia = 0;
  }

  getDiferenciaClass(): string {
    if (Math.abs(this.diferencia) < 0.01) return 'correcto';
    if (this.diferencia > 0) return 'sobrante';
    return 'faltante';
  }

  getDiferenciaTexto(): string {
    if (Math.abs(this.diferencia) < 0.01) return '✅ Correcto';
    if (this.diferencia > 0) return `💰 Sobrante: $${this.diferencia.toFixed(2)}`;
    return `❌ Faltante: $${Math.abs(this.diferencia).toFixed(2)}`;
  }

  private handleModalClose(modalId: string): void {
    if (modalId === 'modal-cerrar-caja') {
      this.cerrarModal(true);
    }
  }
}
