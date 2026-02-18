import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface PrinterConfig {
  nombre: string;
  puerto: string;
  velocidad?: string;
  anchoPapel?: string;
  densidad?: string;
  margenIzquierdo?: number;
  margenDerecho?: number;
  fuente?: string;
  tituloEmpresa?: string;
  subtituloEmpresa?: string;
  pieTicket?: string;
  urlQR?: string;
  mostrarQR?: boolean;
  nombreDispositivo?: string;
}

export interface PrinterStatus {
  online: boolean;
  papel: boolean;
  energia: boolean;
  error?: string | null;
}

export interface AvailablePrinter {
  id: string;
  nombre: string;
  tipo: string;
  dispositivo: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private apiUrl = `${environment.apiUrl}/printer`;

  constructor(private http: HttpClient) {}

  private handleError(error: any): Observable<never> {
    console.error('Error en servicio de impresora:', error);
    const errorMessage = error.error?.error || error.message || 'Error desconocido';
    return throwError(() => new Error(errorMessage));
  }

  // Obtener lista de impresoras disponibles
  getAvailablePrinters(): Observable<{ success: boolean; printers: AvailablePrinter[] }> {
    return this.http.get<{ success: boolean; printers: AvailablePrinter[] }>(`${this.apiUrl}/available`).pipe(
      timeout(15000),
      catchError(this.handleError)
    );
  }

  // Guardar configuración de impresora
  savePrinterConfig(config: PrinterConfig): Observable<{ success: boolean; message: string; config: PrinterConfig }> {
    return this.http.post<{ success: boolean; message: string; config: PrinterConfig }>(
      `${this.apiUrl}/config`,
      config
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // Obtener configuración de impresora
  getPrinterConfig(): Observable<{ success: boolean; config: PrinterConfig | null; message?: string }> {
    return this.http.get<{ success: boolean; config: PrinterConfig | null; message?: string }>(
      `${this.apiUrl}/config`
    ).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // Verificar estado de la impresora
  checkPrinterStatus(): Observable<{ success: boolean; status: PrinterStatus }> {
    return this.http.get<{ success: boolean; status: PrinterStatus }>(`${this.apiUrl}/status`).pipe(
      timeout(15000),
      catchError(this.handleError)
    );
  }

  // Imprimir ticket de prueba
  printTestTicket(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/test`, {}).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }

  // Imprimir ticket personalizado
  printTicket(contenido: string, opciones?: { alineacion?: 'left' | 'center' | 'right' }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/print`,
      { contenido, opciones }
    ).pipe(
      timeout(30000),
      catchError(this.handleError)
    );
  }
}

