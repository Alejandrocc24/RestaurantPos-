import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VentasService } from '../services/ventas.service';
import { ToastService } from '../shared/toast/toast.service';
import { SupabaseService } from '../services/supabase.service';
import { ModalHistoryManager } from '../shared/utils/modal-history-manager';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit, OnDestroy {
  // Datos del recaudo actual
  recaudoActual: number = 0;
  totalVentasHoy: number = 0;
  promedioVenta: number = 0;
  pagosEfectivo: number = 0;
  pagosTransferencia: number = 0;
  pagosTarjeta: number = 0;

  // Datos de mesas cerradas
  mesasCerradas: any[] = [];
  totalMesasCerradas: number = 0;

  // Datos de gastos
  gastosHoy: any[] = [];
  totalGastosHoy: number = 0;
  gastosTotal: number = 0;

  // Estadísticas de productos
  productosVendidos: any[] = [];
  topProductos: any[] = [];

  // Filtros
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroMesa: string = 'todas'; // Cambiado a desplegable
  filtroGasto: string = '';
  filtroProducto: string = '';
  filtroCategoria: string = 'todas'; // Nuevo filtro por categoría
  filtroEstadoCaja: string = '';

  // Lista de mesas disponibles para el filtro
  mesasDisponibles: number[] = [];

  // Lista de categorías disponibles para el filtro
  categoriasDisponibles: string[] = [];

  // Configuración de factura
  configFactura: any = null;

  // Estados de carga
  isLoading: boolean = false;
  isLoadingMesas: boolean = false;
  isLoadingGastos: boolean = false;
  isLoadingProductos: boolean = false;

  // Estado de impresión
  mesaSeleccionada: any = null;
  mostrarModalFactura: boolean = false;
  isImprimiendo: boolean = false;

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Tabs
  currentTab: string = 'mesas';

  // Estado de caja
  cajaAbierta: boolean = false;
  cajaActual: any = null;
  cajasCerradas: any[] = [];
  isLoadingCaja: boolean = false;
  mostrarModalCaja: boolean = false;
  mostrarModalCierreCaja: boolean = false;
  montoInicial: number = 0;
  efectivoReal: number = 0;
  diferenciaCaja: number = 0;

  // Resumen financiero para cierre de caja
  resumenCierreCaja: any = {
    recaudoTotal: 0,
    gastosTotal: 0,
    pagosEfectivo: 0,
    pagosTransferencia: 0,
    efectivoEsperado: 0,
    diferencia: 0
  };

  // Estado del modal de exportar
  mostrarModalExportar: boolean = false;
  tipoReporteActual: string = '';
  formatoSeleccionado: string = '';
  isExportando: boolean = false;
  incluirResumen: boolean = true;
  incluirGraficos: boolean = true;
  incluirFormulas: boolean = false;

  private subscriptions: any[] = [];
  private destroy$ = new Subject<void>();
  private modalHistoryManager: ModalHistoryManager;

  // Función helper para formatear fechas de manera consistente
  private formatearFechaLocal(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  constructor(private ventasService: VentasService, private toast: ToastService, private supabaseService: SupabaseService) {
    // Establecer fechas por defecto (hoy) - usar fecha local
    this.fechaInicio = this.formatearFechaLocal();
    this.fechaFin = this.formatearFechaLocal();
    this.modalHistoryManager = new ModalHistoryManager(this.handleModalClose.bind(this), 'ventas-base');
  }

  ngOnInit(): void {
    this.cargarConfiguracionFactura();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.modalHistoryManager.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarConfiguracionFactura(): void {
    const configGuardada = localStorage.getItem('configFactura');
    if (configGuardada) {
      try {
        this.configFactura = JSON.parse(configGuardada);
      } catch (error) {
        console.error('Error cargando configuración de factura:', error);
        this.configFactura = this.getConfiguracionPorDefecto();
      }
    } else {
      this.configFactura = this.getConfiguracionPorDefecto();
    }
  }

  getConfiguracionPorDefecto(): any {
    return {
      nombreNegocio: 'Heladería Artesanal',
      direccion: 'Calle 123 #45-67',
      telefono: '(+57) 300 123 4567',
      nit: '900.123.456-7',
      email: 'contacto@heladeria.com',
      mostrarLogo: false,
      logoUrl: '',
      mostrarIVA: false,
      porcentajeIVA: 19,
      mensajePie: '¡Gracias por su compra! Vuelva pronto',
      mostrarQR: false,
      tamanoFuente: 12,
      anchoTicket: 80
    };
  }

  cargarDatos(): void {
    this.cargarRecaudo();
    this.cargarMesasCerradas();
    this.cargarGastos();
    this.cargarEstadisticasProductos();
    this.verificarCajaAbierta();
    this.cargarCajasCerradas();
  }

  async cargarRecaudo(): Promise<void> {
    try {
      const recaudo = await this.supabaseService.obtenerRecaudoActual();
      this.recaudoActual = recaudo.total || 0;
      this.totalVentasHoy = recaudo.cantidadVentas || 0;
      this.promedioVenta = this.totalVentasHoy > 0 ? Math.round(this.recaudoActual / this.totalVentasHoy) : 0;
      console.log('Valores asignados - Recaudo:', this.recaudoActual, 'Ventas:', this.totalVentasHoy, 'Promedio:', this.promedioVenta);
    } catch (error) {
      console.error('Error cargando recaudo:', error);
      this.toast.error('Error', 'No se pudo cargar el recaudo');
    }
  }

  async cargarMesasCerradas(): Promise<void> {
    this.isLoadingMesas = true;
    const inicio = this.fechaInicio || this.formatearFechaLocal();
    const fin = this.fechaFin || this.formatearFechaLocal();

    try {
      this.mesasCerradas = await this.supabaseService.obtenerMesasCerradas(inicio, fin) || [];
      this.totalMesasCerradas = this.mesasCerradas.length;

      // Extraer números de mesa únicos para el filtro
      const mesasUnicas = new Set(this.mesasCerradas.map((m: any) => m.numeroMesa || m.mesa_id || m.mesaId));
      this.mesasDisponibles = Array.from(mesasUnicas)
        .filter(m => m !== undefined && m !== null)
        .sort((a: any, b: any) => a - b);
    } catch (error) {
      console.error('Error cargando mesas cerradas:', error);
    } finally {
      this.isLoadingMesas = false;
    }
  }

  cargarGastos(): void {
    this.isLoadingGastos = true;

    // Usar fechaInicio y fechaFin del componente, o la fecha de hoy si no están seteadas
    const inicio = this.fechaInicio || this.formatearFechaLocal();
    const fin = this.fechaFin || this.formatearFechaLocal();

    console.log(`📊 Cargando gastos desde ${inicio} hasta ${fin}`);

    // Usar el servicio de Supabase para obtener gastos del rango de fechas
    this.supabaseService.obtenerGastos(inicio, fin)
      .then((gastos: any[]) => {
        this.gastosHoy = gastos || [];
        this.totalGastosHoy = this.gastosHoy.length;
        this.gastosTotal = this.gastosHoy.reduce((sum: number, gasto: any) => sum + (gasto.monto || 0), 0);

        console.log('✅ Gastos cargados:', this.gastosHoy.length, 'Total:', this.gastosTotal);
        this.isLoadingGastos = false;
      })
      .catch((error: any) => {
        console.error('❌ Error cargando gastos:', error);
        this.gastosHoy = [];
        this.totalGastosHoy = 0;
        this.gastosTotal = 0;
        this.isLoadingGastos = false;
      });
  }

  async cargarEstadisticasProductos(): Promise<void> {
    this.isLoadingProductos = true;
    const inicio = this.fechaInicio || this.formatearFechaLocal();
    const fin = this.fechaFin || this.formatearFechaLocal();

    try {
      this.productosVendidos = await this.supabaseService.obtenerEstadisticasProductos(inicio, fin) || [];

      // Extraer categorías únicas para el filtro
      const categorias = new Set(this.productosVendidos.map(p => p.categoria).filter(c => c && c.trim() !== ''));
      this.categoriasDisponibles = Array.from(categorias).sort();

    } catch (error) {
      console.error('Error cargando estadísticas de productos:', error);
      this.productosVendidos = [];
      this.categoriasDisponibles = [];
    } finally {
      this.isLoadingProductos = false;
    }
  }

  async verificarCajaAbierta(): Promise<void> {
    try {
      const caja = await this.supabaseService.obtenerCajaAbierta();
      if (caja) {
        this.cajaAbierta = true;
        this.cajaActual = caja;
      } else {
        this.cajaAbierta = false;
        this.cajaActual = null;
      }
    } catch (error) {
      console.error('Error verificando caja abierta:', error);
      this.cajaAbierta = false;
      this.cajaActual = null;
    }
  }

  async cargarCajasCerradas(): Promise<void> {
    this.isLoadingCaja = true;
    const inicio = this.fechaInicio || this.formatearFechaLocal();
    const fin = this.fechaFin || this.formatearFechaLocal();

    try {
      this.cajasCerradas = await this.supabaseService.obtenerCajasCerradas(inicio, fin) || [];
    } catch (error) {
      console.error('Error cargando cajas cerradas:', error);
      this.cajasCerradas = [];
    } finally {
      this.isLoadingCaja = false;
    }
  }

  async abrirCaja(): Promise<void> {
    if (this.montoInicial > 0) {
      this.isLoadingCaja = true;

      try {
        const nuevaCaja = await this.supabaseService.abrirCaja(this.montoInicial);

        this.cajaAbierta = true;
        this.cajaActual = nuevaCaja;
        this.cerrarModalCaja();
        this.montoInicial = 0;

        this.mostrarNotificacion('✅ Caja abierta', `Caja abierta con $${nuevaCaja.monto_inicial}`, 'success');
      } catch (error) {
        console.error('Error abriendo caja:', error);
        this.mostrarNotificacion('❌ Error', 'No se pudo abrir la caja', 'error');
      } finally {
        this.isLoadingCaja = false;
      }
    }
  }

  async cerrarCaja(): Promise<void> {
    if (!this.cajaAbierta) {
      this.mostrarNotificacion('❌ No hay caja abierta', 'No se puede cerrar una caja que no esté abierta.', 'error');
      return;
    }

    // ✅ Validar que no haya mesas abiertas
    try {
      const mesasAbiertas = await this.verificarMesasAbiertas();
      if (mesasAbiertas > 0) {
        this.mostrarNotificacion('⚠️ Mesas abiertas', `No se puede cerrar la caja. Hay ${mesasAbiertas} mesa(s) ocupada(s). Cierra todas las cuentas primero.`, 'warning');
        return;
      }
    } catch (error) {
      console.error('Error verificando mesas:', error);
    }

    this.isLoadingCaja = true;

    try {
      // Cargar recaudo del día usando fecha local correctamente formateada
      const recaudo = await this.supabaseService.obtenerRecaudoActual();
      this.resumenCierreCaja.recaudoTotal = recaudo.total || 0;
      this.resumenCierreCaja.pagosEfectivo = recaudo.pagosEfectivo || 0;
      this.resumenCierreCaja.pagosTransferencia = recaudo.pagosTransferencia || 0;

      // Cargar gastos del día usando fecha local
      const fechaLocal = this.formatearFechaLocal();

      const gastos = await this.supabaseService.obtenerGastos(fechaLocal, fechaLocal);
      this.resumenCierreCaja.gastosTotal = gastos.reduce((total: number, gasto: any) => total + (gasto.monto || 0), 0);

      // Calcular efectivo esperado = Monto inicial + Pagos en efectivo - Gastos
      const montoInicial = this.cajaActual?.monto_inicial || 0;
      this.resumenCierreCaja.efectivoEsperado = montoInicial + this.resumenCierreCaja.pagosEfectivo - this.resumenCierreCaja.gastosTotal;

      // Resetear campos de efectivo real y diferencia
      this.efectivoReal = 0;
      this.diferenciaCaja = 0;

      // Mostrar modal de resumen
      this.modalHistoryManager.registerModalOpen('modal-cierre-caja', this.mostrarModalCierreCaja);
      this.mostrarModalCierreCaja = true;

    } catch (error) {
      console.error('Error preparando cierre de caja:', error);
      this.mostrarNotificacion('❌ Error', 'No se pudo preparar el cierre de caja', 'error');
    } finally {
      // ✅ IMPORTANTE: Resetear el loading siempre, incluso si hay error
      this.isLoadingCaja = false;
    }
  }

  async confirmarCierreCaja(): Promise<void> {
    this.isLoadingCaja = true;

    try {
      // Cerrar la caja en el servicio
      await this.supabaseService.cerrarCaja(this.cajaActual.id, {
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_final: this.resumenCierreCaja.efectivoEsperado
      });

      // Actualizar estado local
      this.cajaAbierta = false;
      this.cajaActual = null;

      this.mostrarNotificacion('✅ Caja cerrada', 'Caja cerrada exitosamente', 'success');
      this.cerrarModalCierreCaja();
      this.resetearDatosCaja();

      // Recargar datos
      await this.cargarDatos();
    } catch (error) {
      console.error('Error cerrando caja:', error);
      this.mostrarNotificacion('❌ Error', 'No se pudo cerrar la caja', 'error');
    } finally {
      this.isLoadingCaja = false;
    }
  }

  cerrarModalCierreCaja(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-cierre-caja');
    }
    this.mostrarModalCierreCaja = false;
    // Resetear campos al cerrar el modal
    this.efectivoReal = 0;
    this.diferenciaCaja = 0;
  }

  resetearDatosCaja(): void {
    // Resetear todos los valores de caja
    this.efectivoReal = 0;
    this.diferenciaCaja = 0;
    this.resumenCierreCaja = {
      recaudoTotal: 0,
      gastosTotal: 0,
      pagosEfectivo: 0,
      pagosTransferencia: 0,
      efectivoEsperado: 0,
      diferencia: 0
    };
  }

  calcularDiferenciaCaja(): void {
    // Diferencia = Efectivo Real - Efectivo Esperado
    // Positivo = Sobrante, Negativo = Faltante
    this.diferenciaCaja = this.efectivoReal - this.resumenCierreCaja.efectivoEsperado;
    console.log('Diferencia calculada:', this.diferenciaCaja);
    console.log('Efectivo Real:', this.efectivoReal);
    console.log('Efectivo Esperado:', this.resumenCierreCaja.efectivoEsperado);
  }

  obtenerValorAbsoluto(valor: number): number {
    return Math.abs(valor);
  }

  calcularDiferenciaCajaCerrada(caja: any): number {
    const montoInicial = caja.monto_inicial || caja.montoInicial || 0;
    const montoFinal = caja.monto_final || caja.montoFinal || 0;
    const gastos = caja.total_gastos || 0;

    // Diferencia = Monto Final - (Monto Inicial - Gastos)
    // Si es positivo, hubo ganancia; si es negativo, hubo pérdida
    return montoFinal - montoInicial + gastos;
  }

  async verTicketCaja(caja: any): Promise<void> {
    try {
      console.log('📄 Generando ticket para caja:', caja);

      // Obtener ventas y gastos de esta caja específica
      const fechaApertura = caja.fecha_apertura;
      const fechaCierre = caja.fecha_cierre;

      console.log('📅 Fecha apertura:', fechaApertura);
      console.log('📅 Fecha cierre:', fechaCierre);

      if (!fechaApertura || !fechaCierre) {
        this.mostrarNotificacion('❌ Error', 'No se encontraron las fechas de la caja', 'error');
        return;
      }

      // Filtrar ventas de esta caja usando el backend directamente
      const fechaAperturaDate = new Date(fechaApertura);
      const fechaCierreDate = new Date(fechaCierre);

      console.log('🕐 Rango de búsqueda:');
      console.log('  Desde:', fechaAperturaDate.toISOString());
      console.log('  Hasta:', fechaCierreDate.toISOString());

      // Llamar al backend pidiendo solo las ventas de ese rango de fechas
      // Extraer solo la fecha YYYY-MM-DD para la consulta del servicio
      const aperturaYYYYMMDD = fechaAperturaDate.toISOString().split('T')[0];
      const cierreYYYYMMDD = fechaCierreDate.toISOString().split('T')[0];
      let todasVentasRango = await this.supabaseService.getVentas(aperturaYYYYMMDD, cierreYYYYMMDD);
      
      console.log('📊 Total ventas recuperadas del rango:', todasVentasRango.length);

      const ventasCaja = todasVentasRango.filter((v: any) => {
        if (!v.fecha) return false;
        const fechaVenta = new Date(v.fecha);
        return fechaVenta >= fechaAperturaDate && fechaVenta <= fechaCierreDate;
      });

      console.log('✅ Ventas exactas para esta caja:', ventasCaja.length);

      // Calcular totales por método de pago
      let pagosEfectivo = 0;
      let pagosTransferencia = 0;
      let pagosTarjeta = 0;
      let totalVentas = 0;

      ventasCaja.forEach((v: any) => {
        const total = Number(v.total) || 0;
        totalVentas += total;

        const metodoPago = (v.metodo_pago || 'efectivo').toLowerCase();
        if (metodoPago === 'efectivo') {
          pagosEfectivo += total;
        } else if (metodoPago === 'transferencia') {
          pagosTransferencia += total;
        } else if (metodoPago === 'tarjeta') {
          pagosTarjeta += total;
        }
      });

      // Obtener gastos de esta caja
      const fechaAperturaLocal = new Date(fechaApertura).toISOString().split('T')[0];
      const fechaCierreLocal = new Date(fechaCierre).toISOString().split('T')[0];
      const gastos = await this.supabaseService.obtenerGastos(fechaAperturaLocal, fechaCierreLocal);

      const gastosCaja = gastos.filter((g: any) => {
        const fechaGasto = new Date(g.fecha);
        return fechaGasto >= new Date(fechaApertura) && fechaGasto <= new Date(fechaCierre);
      });

      const totalGastos = gastosCaja.reduce((sum: number, g: any) => sum + (g.monto || 0), 0);

      // Generar e imprimir ticket
      this.imprimirTicketCajaCerrada(caja, {
        totalVentas,
        pagosEfectivo,
        pagosTransferencia,
        pagosTarjeta,
        totalGastos,
        cantidadVentas: ventasCaja.length,
        cantidadGastos: gastosCaja.length,
        ventas: ventasCaja,
        gastos: gastosCaja
      });

    } catch (error) {
      console.error('Error generando ticket:', error);
      this.mostrarNotificacion('❌ Error', 'No se pudo generar el ticket', 'error');
    }
  }

  imprimirTicketCajaCerrada(caja: any, datos: any): void {
    const montoInicial = caja.monto_inicial || 0;
    const montoFinal = caja.monto_final || 0;
    const fechaCierre = new Date(caja.fecha_cierre);
    const fechaApertura = new Date(caja.fecha_apertura);

    const fechaCierreFormateada = fechaCierre.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const fechaAperturaFormateada = fechaApertura.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const efectivoEsperado = montoInicial + datos.pagosEfectivo - datos.totalGastos;
    const diferencia = montoFinal - efectivoEsperado;

    const contenido = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket Caja #${caja.id} - ${fechaCierreFormateada}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .section h2 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ddd;
          }
          .row:last-child { border-bottom: none; }
          .row.total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #000;
            margin-top: 10px;
            padding-top: 10px;
          }
          .label { font-weight: 600; }
          .value { text-align: right; }
          .positivo { color: #10b981; }
          .negativo { color: #ef4444; }
          .diferencia {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
          }
          .diferencia.sobrante { background: #fef3c7; }
          .diferencia.faltante { background: #fee2e2; }
          .diferencia.exacto { background: #d1fae5; }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { padding: 10px; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍦 HELADERÍA</h1>
          <h2>🔒 TICKET DE CAJA #${caja.id}</h2>
          <p>Cerrada: ${fechaCierreFormateada}</p>
        </div>
        
        <div class="section">
          <h2>📅 Información de la Caja</h2>
          <div class="row">
            <span class="label">Apertura:</span>
            <span class="value">${fechaAperturaFormateada}</span>
          </div>
          <div class="row">
            <span class="label">Cierre:</span>
            <span class="value">${fechaCierreFormateada}</span>
          </div>
          <div class="row">
            <span class="label">ID Caja:</span>
            <span class="value">#${caja.id}</span>
          </div>
        </div>
        
        <div class="section">
          <h2>📊 Resumen Financiero</h2>
          <div class="row">
            <span class="label">Total Ventas:</span>
            <span class="value positivo">${this.formatearMoneda(datos.totalVentas)}</span>
          </div>
          <div class="row">
            <span class="label">Cantidad de Ventas:</span>
            <span class="value">${datos.cantidadVentas}</span>
          </div>
          <div class="row">
            <span class="label">Total Gastos:</span>
            <span class="value negativo">${this.formatearMoneda(datos.totalGastos)}</span>
          </div>
          <div class="row">
            <span class="label">Cantidad de Gastos:</span>
            <span class="value">${datos.cantidadGastos}</span>
          </div>
        </div>
        
        <div class="section">
          <h2>💳 Métodos de Pago</h2>
          <div class="row">
            <span class="label">Pagos en Efectivo:</span>
            <span class="value">${this.formatearMoneda(datos.pagosEfectivo)}</span>
          </div>
          <div class="row">
            <span class="label">Pagos por Transferencia:</span>
            <span class="value">${this.formatearMoneda(datos.pagosTransferencia)}</span>
          </div>
          <div class="row">
            <span class="label">Pagos con Tarjeta:</span>
            <span class="value">${this.formatearMoneda(datos.pagosTarjeta)}</span>
          </div>
        </div>
        
        ${datos.ventas && datos.ventas.length > 0 ? `
        <div class="section">
          <h2>🛒 Detalle de Ventas (${datos.ventas.length})</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 8px; text-align: left;">Fecha/Hora</th>
                <th style="padding: 8px; text-align: left;">Mesa</th>
                <th style="padding: 8px; text-align: left;">Método Pago</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${datos.ventas.map((v: any) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 6px;">${new Date(v.fecha).toLocaleString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</td>
                  <td style="padding: 6px;">Mesa ${v.mesa_id || 'N/A'}</td>
                  <td style="padding: 6px;">${v.metodo_pago || 'Efectivo'}</td>
                  <td style="padding: 6px; text-align: right; font-weight: 600;">${this.formatearMoneda(v.total)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #000; font-weight: bold;">
                <td colspan="3" style="padding: 8px; text-align: right;">TOTAL VENTAS:</td>
                <td style="padding: 8px; text-align: right;">${this.formatearMoneda(datos.totalVentas)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        ` : ''}
        
        ${datos.gastos && datos.gastos.length > 0 ? `
        <div class="section">
          <h2>💸 Detalle de Gastos (${datos.gastos.length})</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
                <th style="padding: 8px; text-align: left;">Fecha/Hora</th>
                <th style="padding: 8px; text-align: left;">Descripción</th>
                <th style="padding: 8px; text-align: left;">Categoría</th>
                <th style="padding: 8px; text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${datos.gastos.map((g: any) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 6px;">${new Date(g.fecha).toLocaleString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</td>
                  <td style="padding: 6px;">${g.descripcion || 'Sin descripción'}</td>
                  <td style="padding: 6px;">${g.categoria || 'General'}</td>
                  <td style="padding: 6px; text-align: right; font-weight: 600;">${this.formatearMoneda(g.monto)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #000; font-weight: bold;">
                <td colspan="3" style="padding: 8px; text-align: right;">TOTAL GASTOS:</td>
                <td style="padding: 8px; text-align: right;">${this.formatearMoneda(datos.totalGastos)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2>🧮 Cálculo del Efectivo</h2>
          <div class="row">
            <span class="label">Monto Inicial:</span>
            <span class="value">${this.formatearMoneda(montoInicial)}</span>
          </div>
          <div class="row">
            <span class="label">+ Pagos en Efectivo:</span>
            <span class="value positivo">+${this.formatearMoneda(datos.pagosEfectivo)}</span>
          </div>
          <div class="row">
            <span class="label">- Gastos del Período:</span>
            <span class="value negativo">-${this.formatearMoneda(datos.totalGastos)}</span>
          </div>
          <div class="row total">
            <span class="label">= Efectivo Esperado:</span>
            <span class="value">${this.formatearMoneda(efectivoEsperado)}</span>
          </div>
          <div class="row">
            <span class="label">Efectivo Real Contado:</span>
            <span class="value">${this.formatearMoneda(montoFinal)}</span>
          </div>
        </div>
        
        <div class="diferencia ${diferencia > 0 ? 'sobrante' : diferencia < 0 ? 'faltante' : 'exacto'}">
          <h3>${diferencia > 0 ? '📈 SOBRANTE' : diferencia < 0 ? '📉 FALTANTE' : '✅ EXACTO'}</h3>
          <p style="font-size: 24px; font-weight: bold; margin-top: 10px;">
            ${diferencia === 0 ? 'Cuadra perfecto' : this.formatearMoneda(Math.abs(diferencia))}
          </p>
        </div>
        
        <div class="footer">
          <p>Este documento es un comprobante del cierre de caja</p>
          <p>Generado automáticamente por el sistema</p>
        </div>
      </body>
      </html>
    `;

    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

    if (ventanaImpresion) {
      ventanaImpresion.document.write(contenido);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();

      setTimeout(() => {
        ventanaImpresion.print();
      }, 250);
    }
  }

  seleccionarSugerencia(monto: number): void {
    this.efectivoReal = monto;
    this.calcularDiferenciaCaja();
  }

  seleccionarMontoInicial(monto: number): void {
    this.montoInicial = monto;
  }

  async verificarMesasAbiertas(): Promise<number> {
    try {
      const mesas = await this.supabaseService.getMesas();
      return mesas.filter((m: any) => m.estado === 'ocupado').length;
    } catch (error) {
      console.error('Error verificando mesas:', error);
      return 0;
    }
  }

  imprimirCierreCaja(): void {
    const contenido = this.generarContenidoImpresion();
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

    if (ventanaImpresion) {
      ventanaImpresion.document.write(contenido);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();

      // Esperar a que cargue y luego imprimir
      setTimeout(() => {
        ventanaImpresion.print();
      }, 250);
    }
  }

  generarContenidoImpresion(): string {
    const fecha = new Date();
    const fechaFormateada = fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const montoInicial = this.cajaActual?.monto_inicial || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cierre de Caja - ${fechaFormateada}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .section h2 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ddd;
          }
          .row:last-child { border-bottom: none; }
          .row.total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #000;
            margin-top: 10px;
            padding-top: 10px;
          }
          .label { font-weight: 600; }
          .value { text-align: right; }
          .positivo { color: #10b981; }
          .negativo { color: #ef4444; }
          .diferencia {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
          }
          .diferencia.sobrante { background: #fef3c7; }
          .diferencia.faltante { background: #fee2e2; }
          .diferencia.exacto { background: #d1fae5; }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #000;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .firma {
            margin-top: 40px;
            display: flex;
            justify-content: space-around;
          }
          .firma-box {
            text-align: center;
            width: 200px;
          }
          .firma-linea {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
          }
          @media print {
            body { padding: 10px; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍦 HELADERÍA</h1>
          <h2>🔒 CIERRE DE CAJA</h2>
          <p>${fechaFormateada}</p>
        </div>
        
        <div class="section">
          <h2>📊 Resumen Financiero del Día</h2>
          <div class="row">
            <span class="label">Recaudo Total:</span>
            <span class="value positivo">$${this.formatearMoneda(this.resumenCierreCaja.recaudoTotal)}</span>
          </div>
          <div class="row">
            <span class="label">Gastos Totales:</span>
            <span class="value negativo">$${this.formatearMoneda(this.resumenCierreCaja.gastosTotal)}</span>
          </div>
          <div class="row">
            <span class="label">Pagos en Efectivo:</span>
            <span class="value">$${this.formatearMoneda(this.resumenCierreCaja.pagosEfectivo)}</span>
          </div>
          <div class="row">
            <span class="label">Pagos por Transferencia:</span>
            <span class="value">$${this.formatearMoneda(this.resumenCierreCaja.pagosTransferencia)}</span>
          </div>
        </div>
        
        <div class="section">
          <h2>🧮 Cálculo del Efectivo en Caja</h2>
          <div class="row">
            <span class="label">Monto Inicial:</span>
            <span class="value">$${this.formatearMoneda(montoInicial)}</span>
          </div>
          <div class="row">
            <span class="label">+ Pagos en Efectivo:</span>
            <span class="value positivo">+$${this.formatearMoneda(this.resumenCierreCaja.pagosEfectivo)}</span>
          </div>
          <div class="row">
            <span class="label">- Gastos del Día:</span>
            <span class="value negativo">-$${this.formatearMoneda(this.resumenCierreCaja.gastosTotal)}</span>
          </div>
          <div class="row total">
            <span class="label">= Efectivo Esperado:</span>
            <span class="value">$${this.formatearMoneda(this.resumenCierreCaja.efectivoEsperado)}</span>
          </div>
        </div>
        
        ${this.efectivoReal > 0 ? `
        <div class="section">
          <h2>💵 Conteo de Efectivo</h2>
          <div class="row">
            <span class="label">Efectivo Real Contado:</span>
            <span class="value">$${this.formatearMoneda(this.efectivoReal)}</span>
          </div>
          <div class="diferencia ${this.diferenciaCaja > 0 ? 'sobrante' : this.diferenciaCaja < 0 ? 'faltante' : 'exacto'}">
            <h3>${this.diferenciaCaja > 0 ? '📈 SOBRANTE' : this.diferenciaCaja < 0 ? '📉 FALTANTE' : '✅ EXACTO'}</h3>
            <p style="font-size: 24px; font-weight: bold; margin-top: 10px;">
              ${this.diferenciaCaja === 0 ? 'Cuadra perfecto' : '$' + this.formatearMoneda(Math.abs(this.diferenciaCaja))}
            </p>
          </div>
        </div>
        ` : ''}
        
        <div class="firma">
          <div class="firma-box">
            <div class="firma-linea">Cajero</div>
          </div>
          <div class="firma-box">
            <div class="firma-linea">Supervisor</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Este documento es un comprobante del cierre de caja</p>
          <p>Generado automáticamente por el sistema</p>
        </div>
      </body>
      </html>
    `;
  }

  mostrarModalAbrirCaja(): void {
    this.montoInicial = 0;
    this.modalHistoryManager.registerModalOpen('modal-caja', this.mostrarModalCaja);
    this.mostrarModalCaja = true;
  }

  cerrarModalCaja(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-caja');
    }
    this.mostrarModalCaja = false;
    this.montoInicial = 0;
  }

  validarMontoInicial() {
    // Este método se ejecuta automáticamente al cambiar el monto
    // La validación visual se maneja en el HTML con las clases CSS
    if (this.montoInicial < 0) {
      this.montoInicial = 0;
    }
  }

  aplicarFiltros() {
    this.currentPage = 1;
    this.cargarDatos();
  }

  limpiarFiltros() {
    this.fechaInicio = this.formatearFechaLocal();
    this.fechaFin = this.formatearFechaLocal();
    this.filtroMesa = 'todas';
    this.filtroGasto = '';
    this.filtroProducto = '';
    this.filtroCategoria = 'todas';
    this.filtroEstadoCaja = '';
    this.aplicarFiltros();
  }

  // Métodos de filtros para Gastos
  aplicarFiltrosGastos() {
    this.cargarGastos();
  }

  limpiarFiltrosGastos() {
    this.fechaInicio = this.formatearFechaLocal();
    this.fechaFin = this.formatearFechaLocal();
    this.filtroGasto = '';
    this.aplicarFiltrosGastos();
  }

  // Método para manejar cambios en el filtro de gastos
  onFiltroGastoChange() {
    // Recargar gastos cuando cambie el filtro de texto
    this.cargarGastos();
  }

  onFechagastoChange() {
    // Recargar gastos automáticamente cuando cambian las fechas
    console.log(`📅 Fechas cambiadas: ${this.fechaInicio} - ${this.fechaFin}`);
    this.aplicarFiltrosGastos();
  }

  // Métodos de filtros para Productos
  aplicarFiltrosProductos() {
    this.cargarEstadisticasProductos();
  }

  limpiarFiltrosProductos() {
    this.fechaInicio = this.formatearFechaLocal();
    this.fechaFin = this.formatearFechaLocal();
    this.filtroProducto = '';
    this.filtroCategoria = 'todas';
    this.aplicarFiltrosProductos();
  }

  // Método para manejar cambios en el filtro de productos
  onFiltroProductoChange() {
    // Recalcular estadísticas cuando cambie el filtro de texto
    this.cargarEstadisticasProductos();
  }

  // Método para manejar cambios en el filtro de categorías
  onFiltroCategoriaChange() {
    // Recalcular estadísticas cuando cambie la categoría seleccionada
    this.cargarEstadisticasProductos();
  }

  // Métodos de filtros para Caja
  aplicarFiltrosCaja() {
    this.cargarCajasCerradas();
  }

  limpiarFiltrosCaja() {
    this.fechaInicio = this.formatearFechaLocal();
    this.fechaFin = this.formatearFechaLocal();
    this.filtroEstadoCaja = '';
    this.aplicarFiltrosCaja();
  }

  exportarReporte() {
    // Mostrar opciones de exportación
    const opciones = [
      '📊 Exportar a Excel (.xlsx)',
      '📄 Exportar a PDF',
      '📋 Copiar al Portapapeles',
      '❌ Cancelar'
    ];

    const eleccion = prompt(
      '¿Qué formato de exportación desea usar?\n\n' +
      '1. Excel (.xlsx)\n' +
      '2. PDF\n' +
      '3. Copiar al Portapapeles\n' +
      '4. Cancelar\n\n' +
      'Ingrese el número de su elección (1-4):'
    );

    if (!eleccion || eleccion === '4') return;

    switch (eleccion) {
      case '1':
        this.exportarExcel();
        break;
      case '2':
        this.exportarPDF();
        break;
      case '3':
        this.copiarAlPortapapeles();
        break;
      default:
        this.mostrarNotificacion(
          '❌ Opción Inválida',
          'Por favor seleccione una opción válida (1-4).',
          'error'
        );
    }
  }

  // Métodos originales de exportación (para compatibilidad)
  exportarExcel() {
    try {
      // Crear datos para Excel
      const datosReporte = this.generarDatosReporte();

      // Crear workbook
      const ws_data = [
        ['REPORTE DE VENTAS Y RECAUDO'],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
        ['Período:', `${this.fechaInicio} - ${this.fechaFin}`],
        [],
        ['RESUMEN GENERAL'],
        ['Concepto', 'Valor'],
        ['Total Recaudado', this.formatearMoneda(this.recaudoActual)],
        ['Total Gastos', this.formatearMoneda(this.gastosTotal)],
        ['Número de Mesas Cerradas', this.mesasCerradas.length.toString()],
        [],
        ['DETALLE DE MESAS CERRADAS'],
        ['Mesa', 'Fecha', 'Total', 'Estado']
      ];

      // Agregar mesas cerradas
      this.mesasCerradas.forEach(mesa => {
        ws_data.push([
          mesa.numeroMesa?.toString() || 'N/A',
          new Date(mesa.fecha).toLocaleDateString('es-CO'),
          this.formatearMoneda(mesa.total),
          'Cerrada'
        ]);
      });

      // Agregar productos más vendidos
      ws_data.push([]);
      ws_data.push(['TOP 10 PRODUCTOS MÁS VENDIDOS']);
      ws_data.push(['Producto', 'Cantidad', 'Total Vendido']);

      this.topProductos.forEach(producto => {
        ws_data.push([
          producto.nombre,
          producto.cantidad.toString(),
          this.formatearMoneda(producto.total)
        ]);
      });

      // Crear archivo Excel simulado (en una implementación real usarías una librería como xlsx)
      const contenido = this.convertirACSV(ws_data);
      this.descargarArchivo(contenido, 'reporte-ventas.csv', 'text/csv');

      this.mostrarNotificacion(
        '📊 Excel Exportado',
        'El reporte ha sido exportado como archivo CSV.',
        'success'
      );

    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.mostrarNotificacion(
        '❌ Error en Exportación',
        'No se pudo exportar el archivo Excel.',
        'error'
      );
    }
  }

  exportarPDF() {
    try {
      // Generar contenido HTML para PDF
      const contenidoHTML = this.generarHTMLReporte();

      // Crear ventana de impresión
      const ventanaImpresion = window.open('', '_blank');
      if (ventanaImpresion) {
        ventanaImpresion.document.write(contenidoHTML);
        ventanaImpresion.document.close();

        // Esperar a que cargue y luego imprimir
        setTimeout(() => {
          ventanaImpresion.print();
          ventanaImpresion.close();
        }, 500);

        this.mostrarNotificacion(
          '📄 PDF Generado',
          'Se ha abierto la ventana de impresión para generar el PDF.',
          'success'
        );
      }

    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.mostrarNotificacion(
        '❌ Error en Exportación',
        'No se pudo generar el archivo PDF.',
        'error'
      );
    }
  }

  copiarAlPortapapeles() {
    try {
      const datosReporte = this.generarDatosReporte();
      let textoReporte = '';

      textoReporte += '🍦 REPORTE DE VENTAS Y RECAUDO\n';
      textoReporte += '='.repeat(50) + '\n';
      textoReporte += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
      textoReporte += `📊 Período: ${this.fechaInicio} - ${this.fechaFin}\n\n`;

      textoReporte += '💰 RESUMEN GENERAL\n';
      textoReporte += '-'.repeat(30) + '\n';
      textoReporte += `Total Recaudado: ${this.formatearMoneda(this.recaudoActual)}\n`;
      textoReporte += `Total Gastos: ${this.formatearMoneda(this.gastosTotal)}\n`;
      textoReporte += `Mesas Cerradas: ${this.mesasCerradas.length}\n\n`;

      textoReporte += '🪑 DETALLE DE MESAS\n';
      textoReporte += '-'.repeat(30) + '\n';
      this.mesasCerradas.forEach(mesa => {
        textoReporte += `Mesa ${mesa.numeroMesa}: ${this.formatearMoneda(mesa.total)} - ${new Date(mesa.fecha).toLocaleDateString('es-CO')}\n`;
      });

      textoReporte += '\n🍦 TOP PRODUCTOS\n';
      textoReporte += '-'.repeat(30) + '\n';
      this.topProductos.slice(0, 5).forEach((producto, index) => {
        textoReporte += `${index + 1}. ${producto.nombre}: ${producto.cantidad} unidades - ${this.formatearMoneda(producto.total)}\n`;
      });

      // Copiar al portapapeles
      navigator.clipboard.writeText(textoReporte).then(() => {
        this.mostrarNotificacion(
          '📋 Copiado al Portapapeles',
          'El reporte ha sido copiado al portapapeles.',
          'success'
        );
      }).catch(() => {
        // Fallback para navegadores que no soportan clipboard API
        this.mostrarTextAreaTemporal(textoReporte);
      });

    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      this.mostrarNotificacion(
        '❌ Error al Copiar',
        'No se pudo copiar el reporte al portapapeles.',
        'error'
      );
    }
  }

  // Métodos básicos necesarios
  private generarDatosReporte() {
    return {
      resumen: {
        fecha: new Date().toLocaleDateString('es-CO'),
        periodo: `${this.fechaInicio} - ${this.fechaFin}`,
        totalRecaudado: this.recaudoActual,
        totalGastos: this.gastosTotal,
        numeroMesas: this.mesasCerradas.length
      },
      mesas: this.mesasCerradas.map(mesa => [
        mesa.numeroMesa?.toString() || 'N/A',
        new Date(mesa.fecha).toLocaleDateString('es-CO'),
        this.formatearMoneda(mesa.total),
        'Cerrada'
      ]),
      productos: this.topProductos.map(producto => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        total: producto.total
      }))
    };
  }

  private convertirACSV(datos: any[][]): string {
    return datos.map(fila =>
      fila.map(celda => `"${celda}"`).join(',')
    ).join('\n');
  }

  private generarHTMLReporte(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Ventas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .resumen { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .tabla th, .tabla td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .tabla th { background-color: #f2f2f2; }
          .seccion { margin-bottom: 30px; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍦 Reporte de Ventas y Recaudo</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-CO')} | Período: ${this.fechaInicio} - ${this.fechaFin}</p>
        </div>
        
        <div class="resumen">
          <h2>💰 Resumen General</h2>
          <p><strong>Total Recaudado:</strong> ${this.formatearMoneda(this.recaudoActual)}</p>
          <p><strong>Total Gastos:</strong> ${this.formatearMoneda(this.gastosTotal)}</p>
          <p><strong>Mesas Cerradas:</strong> ${this.mesasCerradas.length}</p>
        </div>
        
        <div class="seccion">
          <h2>🪑 Detalle de Mesas Cerradas</h2>
          <table class="tabla">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${this.mesasCerradas.map(mesa => `
                <tr>
                  <td>Mesa ${mesa.numeroMesa}</td>
                  <td>${new Date(mesa.fecha).toLocaleDateString('es-CO')}</td>
                  <td>${this.formatearMoneda(mesa.total)}</td>
                  <td>Cerrada</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="seccion">
          <h2>🍦 Top 10 Productos Más Vendidos</h2>
          <table class="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Total Vendido</th>
              </tr>
            </thead>
            <tbody>
              ${this.topProductos.map(producto => `
                <tr>
                  <td>${producto.nombre}</td>
                  <td>${producto.cantidad}</td>
                  <td>${this.formatearMoneda(producto.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  private descargarArchivo(contenido: string, nombreArchivo: string, tipoMime: string) {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
  }

  private mostrarTextAreaTemporal(texto: string) {
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.mostrarNotificacion(
        '📋 Copiado al Portapapeles',
        'El reporte ha sido copiado al portapapeles.',
        'success'
      );
    } catch (err) {
      this.mostrarNotificacion(
        '❌ Error al Copiar',
        'No se pudo copiar el reporte. Use Ctrl+C manualmente.',
        'error'
      );
    }

    document.body.removeChild(textArea);
  }

  // Métodos de utilidad
  get mesasFiltradas() {
    if (!this.filtroMesa || this.filtroMesa === 'todas') {
      return this.mesasCerradas;
    }

    const numeroMesaFiltro = parseInt(this.filtroMesa);
    return this.mesasCerradas.filter(mesa => mesa.numeroMesa === numeroMesaFiltro);
  }

  get productosFiltrados() {
    let productos = this.productosVendidos;

    // Filtrar por texto
    if (this.filtroProducto && this.filtroProducto.trim() !== '') {
      const filtro = this.filtroProducto.toLowerCase().trim();
      productos = productos.filter(producto => {
        const nombre = (producto.nombre || '').toLowerCase();
        const categoria = (producto.categoria || '').toLowerCase();
        return nombre.includes(filtro) || categoria.includes(filtro);
      });
    }

    // Filtrar por categoría
    if (this.filtroCategoria && this.filtroCategoria !== 'todas') {
      productos = productos.filter(producto =>
        producto.categoria === this.filtroCategoria
      );
    }

    return productos;
  }

  get gastosFiltrados() {
    let gastos = this.gastosHoy;

    // Filtrar por texto si hay filtro de gasto
    if (this.filtroGasto && this.filtroGasto.trim() !== '') {
      const filtro = this.filtroGasto.toLowerCase().trim();
      gastos = gastos.filter(gasto => {
        const descripcion = (gasto.descripcion || '').toLowerCase();
        const categoria = (gasto.categoria || '').toLowerCase();
        const proveedor = (gasto.proveedor || '').toLowerCase();
        return descripcion.includes(filtro) || categoria.includes(filtro) || proveedor.includes(filtro);
      });
    }

    return gastos;
  }

  get gastosTotalFiltrados(): number {
    return this.gastosFiltrados.reduce((sum: number, gasto: any) => sum + (gasto.monto || 0), 0);
  }

  get mesasPaginadas() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.mesasFiltradas.slice(startIndex, endIndex);
  }

  get totalPages() {
    return Math.ceil(this.mesasFiltradas.length / this.itemsPerPage);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.currentPage = pagina;
    }
  }

  formatearMoneda(valor: number): string {
    // Redondear a entero para evitar decimales
    const valorRedondeado = Math.round(valor || 0);

    // Formatear con separadores de miles
    return '$' + valorRedondeado.toLocaleString('es-CO');
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return 'N/A';
    
    let dateStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    
    // Si la fecha viene de la BD como string "2024-03-13 21:44:40" sin la 'T'
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
      dateStr = dateStr.replace(' ', 'T');
      // Si no tiene 'Z' ni offset, y sabemos que viene de la BD en UTC, podríamos añadir 'Z'
      if (!dateStr.includes('+') && !dateStr.includes('Z')) {
        dateStr += 'Z';
      }
    }

    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  cambiarTab(tab: string): void {
    this.currentTab = tab;
  }

  getTotalMesas(): number {
    return this.mesasFiltradas.reduce((sum, mesa) => sum + (mesa.total || 0), 0);
  }

  getBarPercentage(cantidad: number): number {
    if (this.productosFiltrados.length === 0) return 0;
    const maxCantidad = Math.max(...this.productosFiltrados.map(p => p.cantidad || 0));
    return maxCantidad > 0 ? (cantidad / maxCantidad) * 100 : 0;
  }

  // Método para obtener la fecha actual formateada
  getFechaActual(): string {
    return new Date().toLocaleDateString('es-CO');
  }

  // Métodos para manejo de facturas
  async seleccionarMesa(mesa: any): Promise<void> {
    this.mesaSeleccionada = mesa;
    this.mesaSeleccionada.productos = []; // Inicializar vacío
    this.mesaSeleccionada.cargandoProductos = true;
    this.modalHistoryManager.registerModalOpen('modal-factura', this.mostrarModalFactura);
    this.mostrarModalFactura = true;

    // Obtener productos de la venta
    try {
      console.log('Obteniendo productos para venta ID:', mesa.id);
      const productos = await this.supabaseService.obtenerProductosVenta(mesa.id);
      console.log('Productos obtenidos:', productos);
      this.mesaSeleccionada.productos = productos || [];
      this.mesaSeleccionada.cargandoProductos = false;

      if (productos.length === 0) {
        this.toast.warning('Sin productos', 'No se encontraron productos para esta venta');
      }
    } catch (error) {
      console.error('Error obteniendo productos de la venta:', error);
      this.mesaSeleccionada.productos = [];
      this.mesaSeleccionada.cargandoProductos = false;
      this.toast.error('Error', 'No se pudieron cargar los productos de la venta');
    }
  }

  cerrarModalFactura(desdeHistorial = false): void {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-factura');
    }
    this.mesaSeleccionada = null;
    this.mostrarModalFactura = false;
  }

  async imprimirFactura(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    this.isImprimiendo = true;

    try {
      // Simular proceso de impresión
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aquí se implementaría la lógica real de impresión
      console.log('Imprimiendo factura para:', this.mesaSeleccionada.numeroMesa);
      window.print();

      // Mostrar mensaje de éxito
      this.mostrarNotificacion('🖨️ Impresión', 'Factura enviada a impresión', 'success');

      this.cerrarModalFactura();
    } catch (error) {
      console.error('Error al imprimir factura:', error);
      this.mostrarNotificacion('❌ Error', 'Error al imprimir la factura', 'error');
    } finally {
      this.isImprimiendo = false;
    }
  }

  async exportarFacturaPDF(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    try {
      const factura = this.generarFactura(this.mesaSeleccionada);
      const config = factura.config;

      // Crear contenido HTML para imprimir
      const contenidoHTML = this.generarHTMLFacturaParaImpresion(factura, config);

      // Abrir ventana de impresión
      const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
      if (ventanaImpresion) {
        ventanaImpresion.document.write(contenidoHTML);
        ventanaImpresion.document.close();

        // Esperar a que cargue el contenido
        ventanaImpresion.onload = () => {
          ventanaImpresion.print();
          ventanaImpresion.close();
        };

        this.mostrarNotificacion('✅ PDF Generado', 'Se ha abierto la ventana de impresión', 'success');
      }

    } catch (error) {
      console.error('Error exportando PDF:', error);
      this.mostrarNotificacion('❌ Error', 'No se pudo generar el PDF', 'error');
    }
  }

  private generarHTMLFacturaParaImpresion(factura: any, config: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura - ${factura.numeroFactura}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: ${config.tamanoFuente || 11}px;
            margin: 0;
            padding: 10px;
            width: 80mm;
            line-height: 1.2;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          .factura-info {
            margin-bottom: 10px;
          }
          .productos {
            margin-bottom: 10px;
          }
          .producto {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .totales {
            border-top: 1px dashed #000;
            margin-top: 10px;
            padding-top: 5px;
          }
          .total {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${config.nombreNegocio || 'Heladería Dulce Momento'}</h2>
          <p>${config.direccion || ''}</p>
          <p>Tel: ${config.telefono || ''}</p>
          <p>NIT: ${config.nit || ''}</p>
        </div>

        <div class="factura-info">
          <p><strong>Factura:</strong> ${factura.numeroFactura}</p>
          <p><strong>Fecha:</strong> ${factura.fecha}</p>
          <p><strong>Hora:</strong> ${factura.hora}</p>
          <p><strong>Mesa:</strong> ${factura.mesa}</p>
        </div>

        <div class="productos">
          <div class="producto">
            <span><strong>Cant Producto</strong></span>
            <span><strong>Total</strong></span>
          </div>
          ${factura.items.map((item: any) => `
            <div class="producto">
              <span>${item.cantidad} ${item.descripcion}</span>
              <span>$${this.formatearMoneda(item.total)}</span>
            </div>
          `).join('')}
        </div>

        <div class="totales">
          <div class="producto">
            <span>Subtotal:</span>
            <span>$${this.formatearMoneda(factura.subtotal)}</span>
          </div>
          ${config.mostrarIVA ? `
            <div class="producto">
              <span>IVA (${config.porcentajeIVA}%):</span>
              <span>$${this.formatearMoneda(factura.iva)}</span>
            </div>
          ` : ''}
          <div class="total">
            <span>TOTAL:</span>
            <span>$${this.formatearMoneda(factura.total)}</span>
          </div>
        </div>

        <div class="footer">
          <p>${config.mensajePie || '¡Gracias por su compra!'}</p>
          ${config.mostrarQR ? '<p>📱 Código QR</p>' : ''}
        </div>
      </body>
      </html>
    `;
  }

  generarFactura(mesa: any): any {
    // Generar datos de la factura
    const fecha = new Date(mesa.fecha);
    // Usar número de mesa + fecha como número de factura legible
    const fechaNum = fecha.toLocaleDateString('es-CO').replace(/\/|-/g, '');
    const horaNum = fecha.toLocaleTimeString('es-CO', { hour12: false }).replace(/:/g, '');
    const numeroFactura = `F-${String(mesa.numeroMesa || '?').padStart(2, '0')}-${fechaNum.slice(-4)}${horaNum.slice(0, 4)}`;

    // Usar productos reales de la mesa
    const items = (mesa.productos || []).map((producto: any) => ({
      descripcion: producto.nombre,
      cantidad: producto.cantidad,
      precioUnitario: producto.precio,
      total: producto.subtotal,
      personalizacion: producto.personalizacion || '',
      notas: producto.notas || ''
    }));

    // Si no hay productos, mostrar mensaje
    if (items.length === 0) {
      items.push({
        descripcion: 'Sin productos registrados',
        cantidad: 0,
        precioUnitario: 0,
        total: 0,
        personalizacion: '',
        notas: ''
      });
    }

    // Calcular subtotal e IVA según configuración
    const config = this.configFactura || this.getConfiguracionPorDefecto();
    const subtotal = mesa.total;
    const iva = config.mostrarIVA ? Math.round(subtotal * (config.porcentajeIVA / 100)) : 0;
    const total = config.mostrarIVA ? subtotal + iva : subtotal;

    return {
      numeroFactura,
      fecha: fecha.toLocaleDateString('es-CO'),
      hora: fecha.toLocaleTimeString('es-CO'),
      mesa: mesa.numeroMesa,
      items: items,
      subtotal: subtotal,
      iva: iva,
      total: total,
      config: config // Incluir configuración para el template
    };
  }

  // Método para mostrar notificaciones utilizando el sistema de toasts compartido
  mostrarNotificacion(titulo: string, mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    switch (tipo) {
      case 'success':
        this.toast.success(titulo, mensaje);
        break;
      case 'error':
        this.toast.error(titulo, mensaje);
        break;
      case 'warning':
        this.toast.warning(titulo, mensaje);
        break;
      default:
        this.toast.info(titulo, mensaje);
    }
  }

  // Métodos específicos de exportación para cada tab
  exportarReporteMesas() {
    this.abrirModalExportar('mesas');
  }

  exportarReporteGastos() {
    this.abrirModalExportar('gastos');
  }

  exportarReporteProductos() {
    this.abrirModalExportar('productos');
  }

  exportarReporteCaja() {
    this.abrirModalExportar('caja');
  }

  // Métodos para el modal de exportar
  abrirModalExportar(tipo: string) {
    this.tipoReporteActual = tipo;
    this.formatoSeleccionado = '';
    this.incluirResumen = true;
    this.incluirGraficos = true;
    this.incluirFormulas = false;
    this.modalHistoryManager.registerModalOpen('modal-exportar', this.mostrarModalExportar);
    this.mostrarModalExportar = true;
  }

  cerrarModalExportar(desdeHistorial = false) {
    if (!desdeHistorial) {
      this.modalHistoryManager.removeModalHistoryEntry('modal-exportar');
    }
    this.mostrarModalExportar = false;
    this.tipoReporteActual = '';
    this.formatoSeleccionado = '';
    this.isExportando = false;
  }

  seleccionarFormato(formato: string) {
    this.formatoSeleccionado = formato;

    // Ajustar configuraciones por defecto según el formato
    if (formato === 'clipboard') {
      this.incluirGraficos = false;
    } else {
      this.incluirGraficos = true;
    }
  }

  getIconoTipoReporte(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'mesas': '🪑',
      'gastos': '💸',
      'productos': '🍦',
      'caja': '💰'
    };
    return iconos[tipo] || '📄';
  }

  getCantidadRegistros(tipo: string): number {
    switch (tipo) {
      case 'mesas':
        return this.mesasCerradas.length;
      case 'gastos':
        return this.gastosFiltrados.length; // ✅ Ahora devuelve gastos filtrados
      case 'productos':
        return this.productosFiltrados.length; // ✅ Ahora devuelve productos filtrados
      case 'caja':
        return this.cajasCerradas.length;
      default:
        return 0;
    }
  }

  async confirmarExportacion() {
    if (!this.formatoSeleccionado || !this.tipoReporteActual) {
      this.mostrarNotificacion(
        '⚠️ Formato requerido',
        'Por favor seleccione un formato de exportación.',
        'warning'
      );
      return;
    }

    this.isExportando = true;

    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (this.formatoSeleccionado) {
        case 'excel':
          await this.exportarExcelEspecifico(this.tipoReporteActual);
          break;
        case 'pdf':
          await this.exportarPDFEspecifico(this.tipoReporteActual);
          break;
        case 'clipboard':
          await this.copiarAlPortapapelesEspecifico(this.tipoReporteActual);
          break;
      }

      this.cerrarModalExportar();

    } catch (error) {
      console.error('Error en exportación:', error);
      this.mostrarNotificacion(
        '❌ Error en Exportación',
        'Ocurrió un error al exportar el reporte. Intente nuevamente.',
        'error'
      );
    } finally {
      this.isExportando = false;
    }
  }

  private mostrarOpcionesExportacion(tipo: string) {
    const opciones = [
      '📊 Exportar a Excel (.xlsx)',
      '📄 Exportar a PDF',
      '📋 Copiar al Portapapeles',
      '❌ Cancelar'
    ];

    const eleccion = prompt(
      `¿Qué formato de exportación desea usar para el reporte de ${this.getNombreTab(tipo)}?\n\n` +
      '1. Excel (.xlsx)\n' +
      '2. PDF\n' +
      '3. Copiar al Portapapeles\n' +
      '4. Cancelar\n\n' +
      'Ingrese el número de su elección (1-4):'
    );

    if (!eleccion || eleccion === '4') return;

    switch (eleccion) {
      case '1':
        this.exportarExcelEspecifico(tipo);
        break;
      case '2':
        this.exportarPDFEspecifico(tipo);
        break;
      case '3':
        this.copiarAlPortapapelesEspecifico(tipo);
        break;
      default:
        this.mostrarNotificacion(
          '❌ Opción Inválida',
          'Por favor seleccione una opción válida (1-4).',
          'error'
        );
    }
  }

  private getNombreTab(tipo: string): string {
    const nombres: { [key: string]: string } = {
      'mesas': 'Mesas Cerradas',
      'gastos': 'Gastos',
      'productos': 'Productos',
      'caja': 'Caja'
    };
    return nombres[tipo] || 'Reporte';
  }

  private exportarExcelEspecifico(tipo: string) {
    try {
      let ws_data: any[][] = [];
      let nombreArchivo = '';

      switch (tipo) {
        case 'mesas':
          ws_data = this.generarDatosExcelMesas();
          nombreArchivo = 'reporte-mesas-cerradas.csv';
          break;
        case 'gastos':
          ws_data = this.generarDatosExcelGastos();
          nombreArchivo = 'reporte-gastos.csv';
          break;
        case 'productos':
          ws_data = this.generarDatosExcelProductos();
          nombreArchivo = 'reporte-productos.csv';
          break;
        case 'caja':
          ws_data = this.generarDatosExcelCaja();
          nombreArchivo = 'reporte-caja.csv';
          break;
        default:
          this.mostrarNotificacion('❌ Error', 'Tipo de reporte no válido', 'error');
          return;
      }

      const contenido = this.convertirACSV(ws_data);
      this.descargarArchivo(contenido, nombreArchivo, 'text/csv');

      this.mostrarNotificacion(
        '📊 Excel Exportado',
        `El reporte de ${this.getNombreTab(tipo)} ha sido exportado.`,
        'success'
      );

    } catch (error) {
      console.error('Error al exportar Excel específico:', error);
      this.mostrarNotificacion(
        '❌ Error en Exportación',
        'No se pudo exportar el archivo Excel.',
        'error'
      );
    }
  }

  private exportarPDFEspecifico(tipo: string) {
    try {
      let contenidoHTML = '';
      let titulo = '';

      switch (tipo) {
        case 'mesas':
          contenidoHTML = this.generarHTMLReporteMesas();
          titulo = 'Reporte de Mesas Cerradas';
          break;
        case 'gastos':
          contenidoHTML = this.generarHTMLReporteGastos();
          titulo = 'Reporte de Gastos';
          break;
        case 'productos':
          contenidoHTML = this.generarHTMLReporteProductos();
          titulo = 'Reporte de Productos';
          break;
        case 'caja':
          contenidoHTML = this.generarHTMLReporteCaja();
          titulo = 'Reporte de Caja';
          break;
        default:
          this.mostrarNotificacion('❌ Error', 'Tipo de reporte no válido', 'error');
          return;
      }

      const ventanaImpresion = window.open('', '_blank');
      if (ventanaImpresion) {
        ventanaImpresion.document.write(contenidoHTML);
        ventanaImpresion.document.close();

        setTimeout(() => {
          ventanaImpresion.print();
          ventanaImpresion.close();
        }, 500);

        this.mostrarNotificacion(
          '📄 PDF Generado',
          `Se ha abierto la ventana de impresión para el reporte de ${this.getNombreTab(tipo)}.`,
          'success'
        );
      }

    } catch (error) {
      console.error('Error al exportar PDF específico:', error);
      this.mostrarNotificacion(
        '❌ Error en Exportación',
        'No se pudo generar el archivo PDF.',
        'error'
      );
    }
  }

  private copiarAlPortapapelesEspecifico(tipo: string) {
    try {
      let textoReporte = '';
      let titulo = '';

      switch (tipo) {
        case 'mesas':
          textoReporte = this.generarTextoReporteMesas();
          titulo = 'Mesas Cerradas';
          break;
        case 'gastos':
          textoReporte = this.generarTextoReporteGastos();
          titulo = 'Gastos';
          break;
        case 'productos':
          textoReporte = this.generarTextoReporteProductos();
          titulo = 'Productos';
          break;
        case 'caja':
          textoReporte = this.generarTextoReporteCaja();
          titulo = 'Caja';
          break;
        default:
          this.mostrarNotificacion('❌ Error', 'Tipo de reporte no válido', 'error');
          return;
      }

      navigator.clipboard.writeText(textoReporte).then(() => {
        this.mostrarNotificacion(
          '📋 Copiado al Portapapeles',
          `El reporte de ${titulo} ha sido copiado al portapapeles.`,
          'success'
        );
      }).catch(() => {
        this.mostrarTextAreaTemporal(textoReporte);
      });

    } catch (error) {
      console.error('Error al copiar al portapapeles específico:', error);
      this.mostrarNotificacion(
        '❌ Error al Copiar',
        'No se pudo copiar el reporte al portapapeles.',
        'error'
      );
    }
  }

  // Métodos de generación de datos para Excel
  private generarDatosExcelMesas(): any[][] {
    return [
      ['REPORTE DE MESAS CERRADAS'],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
      ['Período:', `${this.fechaInicio} - ${this.fechaFin}`],
      [],
      ['RESUMEN GENERAL'],
      ['Concepto', 'Valor'],
      ['Total Recaudado', this.formatearMoneda(this.recaudoActual)],
      ['Total Mesas Cerradas', this.mesasCerradas.length.toString()],
      ['Total General', this.formatearMoneda(this.getTotalMesas())],
      [],
      ['DETALLE DE MESAS CERRADAS'],
      ['Mesa', 'Fecha', 'Total', 'Productos', 'Estado']
    ].concat(
      this.mesasCerradas.map(mesa => [
        mesa.numeroMesa?.toString() || 'N/A',
        new Date(mesa.fecha).toLocaleDateString('es-CO'),
        this.formatearMoneda(mesa.total),
        mesa.cantidadProductos || 0,
        'Cerrada'
      ])
    );
  }

  private generarDatosExcelGastos(): any[][] {
    return [
      ['REPORTE DE GASTOS'],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
      ['Período:', `${this.fechaInicio} - ${this.fechaFin}`],
      [],
      ['RESUMEN GENERAL'],
      ['Concepto', 'Valor'],
      ['Total Gastos', this.formatearMoneda(this.gastosTotalFiltrados)],
      ['Número de Gastos', this.gastosFiltrados.length.toString()],
      [],
      ['DETALLE DE GASTOS'],
      ['Fecha', 'Descripción', 'Categoría', 'Monto', 'Proveedor']
    ].concat(
      this.gastosFiltrados.map(gasto => [
        new Date(gasto.fecha).toLocaleDateString('es-CO'),
        gasto.descripcion,
        gasto.categoria,
        this.formatearMoneda(gasto.monto),
        (gasto.proveedor === 'personalizado' ? gasto.proveedor_personalizado || 'N/A' : gasto.proveedor || 'N/A')
      ])
    );
  }

  private generarDatosExcelProductos(): any[][] {
    return [
      ['REPORTE DE PRODUCTOS VENDIDOS'],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
      ['Período:', `${this.fechaInicio} - ${this.fechaFin}`],
      [],
      ['RESUMEN GENERAL'],
      ['Concepto', 'Valor'],
      ['Total Productos', this.productosVendidos.length.toString()],
      ['Productos Únicos', this.topProductos.length.toString()],
      [],
      ['TOP 10 PRODUCTOS MÁS VENDIDOS'],
      ['Ranking', 'Producto', 'Cantidad', 'Precio Unitario', 'Total Vendido', 'Categoría']
    ].concat(
      this.topProductos.map((producto, index) => [
        `#${index + 1}`,
        producto.nombre,
        producto.cantidad.toString(),
        this.formatearMoneda(producto.precio),
        this.formatearMoneda(producto.total),
        producto.categoria
      ])
    );
  }

  private generarDatosExcelCaja(): any[][] {
    return [
      ['REPORTE DE GESTIÓN DE CAJA'],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
      ['Período:', `${this.fechaInicio} - ${this.fechaFin}`],
      [],
      ['ESTADO ACTUAL DE CAJA'],
      ['Concepto', 'Valor'],
      ['Estado', this.cajaAbierta ? 'Abierta' : 'Cerrada'],
      ['Monto Inicial', this.cajaAbierta ? this.formatearMoneda(this.cajaActual?.monto_inicial || 0) : 'N/A'],
      ['Fecha Apertura', this.cajaAbierta ? new Date(this.cajaActual?.fecha_apertura).toLocaleDateString('es-CO') : 'N/A'],
      [],
      ['REPORTE DE CAJAS CERRADAS'],
      ['ID', 'Fecha Apertura', 'Fecha Cierre', 'Monto Inicial', 'Monto Final', 'Usuario']
    ].concat(
      this.cajasCerradas.map(caja => [
        caja.id.toString(),
        new Date(caja.fecha_apertura).toLocaleDateString('es-CO'),
        caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleDateString('es-CO') : 'N/A',
        this.formatearMoneda(caja.monto_inicial),
        caja.monto_final ? this.formatearMoneda(caja.monto_final) : 'N/A',
        caja.usuarioApertura
      ])
    );
  }

  // Métodos de generación de HTML para PDF
  private generarHTMLReporteMesas(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Mesas Cerradas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .resumen { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .tabla th, .tabla td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .tabla th { background-color: #f2f2f2; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🪑 Reporte de Mesas Cerradas</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-CO')} | Período: ${this.fechaInicio} - ${this.fechaFin}</p>
        </div>
        
        <div class="resumen">
          <h2>💰 Resumen General</h2>
          <p><strong>Total Recaudado:</strong> ${this.formatearMoneda(this.recaudoActual)}</p>
          <p><strong>Total Mesas Cerradas:</strong> ${this.mesasCerradas.length}</p>
          <p><strong>Total General:</strong> ${this.formatearMoneda(this.getTotalMesas())}</p>
        </div>
        
        <div class="seccion">
          <h2>🪑 Detalle de Mesas Cerradas</h2>
          <table class="tabla">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Productos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${this.mesasCerradas.map(mesa => `
                <tr>
                  <td>Mesa ${mesa.numeroMesa}</td>
                  <td>${new Date(mesa.fecha).toLocaleDateString('es-CO')}</td>
                  <td>${this.formatearMoneda(mesa.total)}</td>
                  <td>${mesa.cantidadProductos || 0}</td>
                  <td>Cerrada</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  private generarHTMLReporteGastos(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Gastos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .resumen { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .tabla th, .tabla td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .tabla th { background-color: #f2f2f2; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💸 Reporte de Gastos</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-CO')} | Período: ${this.fechaInicio} - ${this.fechaFin}</p>
        </div>
        
        <div class="resumen">
          <h2>💰 Resumen General</h2>
          <p><strong>Total Gastos:</strong> ${this.formatearMoneda(this.gastosTotalFiltrados)}</p>
          <p><strong>Número de Gastos:</strong> ${this.gastosFiltrados.length}</p>
        </div>
        
        <div class="seccion">
          <h2>💸 Detalle de Gastos</h2>
          <table class="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Proveedor</th>
              </tr>
            </thead>
            <tbody>
              ${this.gastosFiltrados.map(gasto => `
                <tr>
                  <td>${new Date(gasto.fecha).toLocaleDateString('es-CO')}</td>
                  <td>${gasto.descripcion}</td>
                  <td>${gasto.categoria}</td>
                  <td>${this.formatearMoneda(gasto.monto)}</td>
                  <td>${(gasto.proveedor === 'personalizado' ? gasto.proveedor_personalizado || 'N/A' : gasto.proveedor || 'N/A')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  private generarHTMLReporteProductos(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Productos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .resumen { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .tabla th, .tabla td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .tabla th { background-color: #f2f2f2; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍦 Reporte de Productos Vendidos</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-CO')} | Período: ${this.fechaInicio} - ${this.fechaFin}</p>
        </div>
        
        <div class="resumen">
          <h2>💰 Resumen General</h2>
          <p><strong>Total Productos:</strong> ${this.productosVendidos.length}</p>
          <p><strong>Productos Únicos:</strong> ${this.topProductos.length}</p>
        </div>
        
        <div class="seccion">
          <h2>🏆 Top 10 Productos Más Vendidos</h2>
          <table class="tabla">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total Vendido</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              ${this.topProductos.map((producto, index) => `
                <tr>
                  <td>#${index + 1}</td>
                  <td>${producto.nombre}</td>
                  <td>${producto.cantidad}</td>
                  <td>${this.formatearMoneda(producto.precio)}</td>
                  <td>${this.formatearMoneda(producto.total)}</td>
                  <td>${producto.categoria}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  private generarHTMLReporteCaja(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte de Caja</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .resumen { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .tabla { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .tabla th, .tabla td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .tabla th { background-color: #f2f2f2; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 Reporte de Gestión de Caja</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-CO')} | Período: ${this.fechaInicio} - ${this.fechaFin}</p>
        </div>
        
        <div class="resumen">
          <h2>💰 Estado Actual de Caja</h2>
          <p><strong>Estado:</strong> ${this.cajaAbierta ? 'Abierta' : 'Cerrada'}</p>
          <p><strong>Monto Inicial:</strong> ${this.cajaAbierta ? this.formatearMoneda(this.cajaActual?.monto_inicial || 0) : 'N/A'}</p>
          <p><strong>Fecha Apertura:</strong> ${this.cajaAbierta ? new Date(this.cajaActual?.fecha_apertura).toLocaleDateString('es-CO') : 'N/A'}</p>
        </div>
        
        <div class="seccion">
          <h2>📊 Reporte de Cajas Cerradas</h2>
          <table class="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha Apertura</th>
                <th>Fecha Cierre</th>
                <th>Monto Inicial</th>
                <th>Monto Final</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              ${this.cajasCerradas.map(caja => `
                <tr>
                  <td>${caja.id}</td>
                  <td>${new Date(caja.fecha_apertura).toLocaleDateString('es-CO')}</td>
                  <td>${caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleDateString('es-CO') : 'N/A'}</td>
                  <td>${this.formatearMoneda(caja.monto_inicial)}</td>
                  <td>${caja.monto_final ? this.formatearMoneda(caja.monto_final) : 'N/A'}</td>
                  <td>${caja.usuarioApertura}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  // Métodos de generación de texto para portapapeles
  private generarTextoReporteMesas(): string {
    let texto = '';
    texto += '🪑 REPORTE DE MESAS CERRADAS\n';
    texto += '='.repeat(50) + '\n';
    texto += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
    texto += `📊 Período: ${this.fechaInicio} - ${this.fechaFin}\n\n`;

    texto += '💰 RESUMEN GENERAL\n';
    texto += '-'.repeat(30) + '\n';
    texto += `Total Recaudado: ${this.formatearMoneda(this.recaudoActual)}\n`;
    texto += `Total Mesas Cerradas: ${this.mesasCerradas.length}\n`;
    texto += `Total General: ${this.formatearMoneda(this.getTotalMesas())}\n\n`;

    texto += '🪑 DETALLE DE MESAS\n';
    texto += '-'.repeat(30) + '\n';
    this.mesasCerradas.forEach(mesa => {
      texto += `Mesa ${mesa.numeroMesa}: ${this.formatearMoneda(mesa.total)} - ${new Date(mesa.fecha).toLocaleDateString('es-CO')} - ${mesa.cantidadProductos || 0} productos\n`;
    });

    return texto;
  }

  private generarTextoReporteGastos(): string {
    let texto = '';
    texto += '💸 REPORTE DE GASTOS\n';
    texto += '='.repeat(50) + '\n';
    texto += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
    texto += `📊 Período: ${this.fechaInicio} - ${this.fechaFin}\n\n`;

    texto += '💰 RESUMEN GENERAL\n';
    texto += '-'.repeat(30) + '\n';
    texto += `Total Gastos: ${this.formatearMoneda(this.gastosTotalFiltrados)}\n`;
    texto += `Número de Gastos: ${this.gastosFiltrados.length}\n\n`;

    texto += '💸 DETALLE DE GASTOS\n';
    texto += '-'.repeat(30) + '\n';
    this.gastosFiltrados.forEach(gasto => {
      texto += `${new Date(gasto.fecha).toLocaleDateString('es-CO')}: ${gasto.descripcion} - ${gasto.categoria} - ${this.formatearMoneda(gasto.monto)} - ${(gasto.proveedor === 'personalizado' ? gasto.proveedor_personalizado || 'N/A' : gasto.proveedor || 'N/A')}\n`;
    });

    return texto;
  }

  private generarTextoReporteProductos(): string {
    let texto = '';
    texto += '🍦 REPORTE DE PRODUCTOS VENDIDOS\n';
    texto += '='.repeat(50) + '\n';
    texto += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
    texto += `📊 Período: ${this.fechaInicio} - ${this.fechaFin}\n\n`;

    texto += '💰 RESUMEN GENERAL\n';
    texto += '-'.repeat(30) + '\n';
    texto += `Total Productos: ${this.productosVendidos.length}\n`;
    texto += `Productos Únicos: ${this.topProductos.length}\n\n`;

    texto += '🏆 TOP PRODUCTOS\n';
    texto += '-'.repeat(30) + '\n';
    this.topProductos.forEach((producto, index) => {
      texto += `${index + 1}. ${producto.nombre}: ${producto.cantidad} unidades - ${this.formatearMoneda(producto.precio)} c/u - ${this.formatearMoneda(producto.total)} total - ${producto.categoria}\n`;
    });

    return texto;
  }

  private generarTextoReporteCaja(): string {
    let texto = '';
    texto += '💰 REPORTE DE GESTIÓN DE CAJA\n';
    texto += '='.repeat(50) + '\n';
    texto += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
    texto += `📊 Período: ${this.fechaInicio} - ${this.fechaFin}\n\n`;

    texto += '💰 ESTADO ACTUAL DE CAJA\n';
    texto += '-'.repeat(30) + '\n';
    texto += `Estado: ${this.cajaAbierta ? 'Abierta' : 'Cerrada'}\n`;
    texto += `Monto Inicial: ${this.cajaAbierta ? this.formatearMoneda(this.cajaActual?.monto_inicial || 0) : 'N/A'}\n`;
    texto += `Fecha Apertura: ${this.cajaAbierta ? new Date(this.cajaActual?.fecha_apertura).toLocaleDateString('es-CO') : 'N/A'}\n\n`;

    texto += '📊 CAJAS CERRADAS\n';
    texto += '-'.repeat(30) + '\n';
    this.cajasCerradas.forEach(caja => {
      texto += `ID ${caja.id}: ${new Date(caja.fecha_apertura).toLocaleDateString('es-CO')} - ${caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleDateString('es-CO') : 'N/A'} - ${this.formatearMoneda(caja.monto_inicial)} - ${caja.monto_final ? this.formatearMoneda(caja.monto_final) : 'N/A'}\n`;
    });

    return texto;
  }

  private handleModalClose(modalId: string): void {
    switch (modalId) {
      case 'modal-factura':
        this.cerrarModalFactura(true);
        break;
      case 'modal-caja':
        this.cerrarModalCaja(true);
        break;
      case 'modal-cierre-caja':
        this.cerrarModalCierreCaja(true);
        break;
      case 'modal-exportar':
        this.cerrarModalExportar(true);
        break;
      default:
        break;
    }
  }
}
