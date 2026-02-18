import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BackupOptions {
  baseDatos: boolean;
  archivos: boolean;
}

export interface BackupMetadata {
  id?: number;
  nombre: string;
  descripcion?: string;
  fecha?: string;
  tamano?: string;
  tipo?: string;
  registros?: number;
  google_drive_id?: string;
  google_drive_url?: string;
  estado?: string;
}

export interface BackupResponse {
  success: boolean;
  message?: string;
  backup?: BackupMetadata;
  respaldos?: BackupMetadata[];
  total?: number;
  error?: string;
  details?: string;
  resultados?: {
    tablas_restauradas: string[];
    tablas_con_errores: any[];
    total_registros: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private apiUrl = `${environment.apiUrl}/backup`;

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo respaldo
   */
  createBackup(nombre: string, descripcion: string, opciones: BackupOptions): Observable<BackupResponse> {
    const payload = {
      nombre,
      descripcion,
      opciones
    };

    return this.http.post<BackupResponse>(`${this.apiUrl}/create`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Listar todos los respaldos disponibles
   */
  listBackups(): Observable<BackupResponse> {
    return this.http.get<BackupResponse>(`${this.apiUrl}/list`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Descargar un respaldo específico
   */
  downloadBackup(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${id}`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener URL de descarga de Google Drive
   */
  getDownloadUrl(id: number): Observable<{ success: boolean; url?: string; error?: string }> {
    return this.http.get<{ success: boolean; url?: string; error?: string }>(
      `${this.apiUrl}/url/${id}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Restaurar desde un archivo de respaldo
   */
  restoreBackup(file: File): Observable<BackupResponse> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          this.http.post<BackupResponse>(`${this.apiUrl}/restore`, { backupData }).pipe(
            catchError(this.handleError)
          ).subscribe({
            next: (response) => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        } catch (parseError) {
          observer.error({
            success: false,
            error: 'Error al leer el archivo de respaldo'
          });
        }
      };

      reader.onerror = () => {
        observer.error({
          success: false,
          error: 'Error al leer el archivo'
        });
      };

      reader.readAsText(file);
    });
  }

  /**
   * Restaurar desde un respaldo existente en el historial
   */
  restoreFromHistory(backupId: number): Observable<BackupResponse> {
    return new Observable(observer => {
      // Primero descargar el respaldo
      this.downloadBackup(backupId).subscribe({
        next: (blob) => {
          const reader = new FileReader();
          
          reader.onload = (e: any) => {
            try {
              const backupData = JSON.parse(e.target.result);
              
              this.http.post<BackupResponse>(`${this.apiUrl}/restore`, { backupData }).pipe(
                catchError(this.handleError)
              ).subscribe({
                next: (response) => {
                  observer.next(response);
                  observer.complete();
                },
                error: (error) => {
                  observer.error(error);
                }
              });
            } catch (parseError) {
              observer.error({
                success: false,
                error: 'Error al procesar el respaldo'
              });
            }
          };

          reader.readAsText(blob);
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Eliminar un respaldo
   */
  deleteBackup(id: number): Observable<BackupResponse> {
    return this.http.delete<BackupResponse>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Descargar respaldo como archivo
   */
  downloadBackupAsFile(id: number, nombre: string): void {
    this.downloadBackup(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nombre}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando respaldo:', error);
      }
    });
  }

  /**
   * Abrir respaldo en Google Drive
   */
  openInGoogleDrive(id: number): void {
    this.getDownloadUrl(id).subscribe({
      next: (response) => {
        if (response.success && response.url) {
          window.open(response.url, '_blank');
        }
      },
      error: (error) => {
        console.error('Error obteniendo URL de Google Drive:', error);
      }
    });
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any): Observable<never> {
    console.error('Error en BackupService:', error);
    
    let errorMessage = 'Ocurrió un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error) {
      // Error del servidor
      errorMessage = error.error.error || error.error.message || errorMessage;
    }
    
    return throwError(() => ({
      success: false,
      error: errorMessage
    }));
  }
}
