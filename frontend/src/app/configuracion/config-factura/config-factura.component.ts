import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast/toast.service';

export interface ConfigFactura {
  nombreNegocio: string;
  direccion: string;
  telefono: string;
  nit: string;
  email: string;
  mostrarLogo: boolean;
  logoUrl: string;
  mostrarIVA: boolean;
  porcentajeIVA: number;
  mensajePie: string;
  mostrarQR: boolean;
  tamanoFuente: number;
  anchoTicket: number;
}

@Component({
  selector: 'app-config-factura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-factura.component.html',
  styleUrl: './config-factura.component.css'
})
export class ConfigFacturaComponent implements OnInit {
  config: ConfigFactura = {
    nombreNegocio: 'Heladería Artesanal',
    direccion: 'Calle 123 #45-67',
    telefono: '(+57) 300 123 4567',
    nit: '900.123.456-7',
    email: 'contacto@heladeria.com',
    mostrarLogo: true,
    logoUrl: '',
    mostrarIVA: false,
    porcentajeIVA: 19,
    mensajePie: '¡Gracias por su compra! Vuelva pronto',
    mostrarQR: false,
    tamanoFuente: 12,
    anchoTicket: 80
  };

  vistaPrevia: any = null;

  constructor(private toast: ToastService) {}

  ngOnInit(): void {
    this.cargarConfiguracion();
    this.generarVistaPrevia();
  }

  cargarConfiguracion(): void {
    const configGuardada = localStorage.getItem('configFactura');
    if (configGuardada) {
      try {
        this.config = JSON.parse(configGuardada);
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    }
  }

  guardarConfiguracion(): void {
    try {
      localStorage.setItem('configFactura', JSON.stringify(this.config));
      this.toast.success('Configuración guardada', 'Los cambios se han guardado correctamente');
      this.generarVistaPrevia();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      this.toast.error('Error', 'No se pudo guardar la configuración');
    }
  }

  restaurarDefecto(): void {
    if (confirm('¿Está seguro de restaurar la configuración por defecto?')) {
      this.config = {
        nombreNegocio: 'Heladería Artesanal',
        direccion: 'Calle 123 #45-67',
        telefono: '(+57) 300 123 4567',
        nit: '900.123.456-7',
        email: 'contacto@heladeria.com',
        mostrarLogo: true,
        logoUrl: '',
        mostrarIVA: false,
        porcentajeIVA: 19,
        mensajePie: '¡Gracias por su compra! Vuelva pronto',
        mostrarQR: false,
        tamanoFuente: 12,
        anchoTicket: 80
      };
      this.guardarConfiguracion();
    }
  }

  generarVistaPrevia(): void {
    this.vistaPrevia = {
      numeroFactura: 'F-000001',
      fecha: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO'),
      mesa: 5,
      items: [
        { descripcion: 'Helado de Vainilla', cantidad: 2, precioUnitario: 3500, total: 7000 },
        { descripcion: 'Batido de Chocolate', cantidad: 1, precioUnitario: 4500, total: 4500 }
      ],
      subtotal: 11500,
      iva: this.config.mostrarIVA ? Math.round(11500 * (this.config.porcentajeIVA / 100)) : 0,
      total: this.config.mostrarIVA ? 11500 + Math.round(11500 * (this.config.porcentajeIVA / 100)) : 11500
    };
  }

  onConfigChange(): void {
    this.generarVistaPrevia();
  }

  imprimirVistaPrevia(): void {
    window.print();
  }

  formatearMoneda(valor: number): string {
    return valor.toLocaleString('es-CO');
  }
}
