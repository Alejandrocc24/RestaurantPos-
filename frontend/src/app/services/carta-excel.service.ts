import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ImportacionResultado {
    success: boolean;
    message?: string;
    error?: string;
    resultado?: {
        categoriasCreadas: number;
        categoriasActualizadas: number;
        subcategoriasCreadas: number;
        productosCreados: number;
        productosActualizados: number;
        gruposCreados: number;
        opcionesCreadas: number;
        comentariosCreados: number;
        errores: string[];
    };
}

@Injectable({
    providedIn: 'root'
})
export class CartaExcelService {
    private apiUrl = `${environment.apiUrl}/carta-excel`;

    constructor(private http: HttpClient) { }

    /**
     * Descargar la carta como archivo Excel
     */
    exportarCarta(): void {
        this.http.get(`${this.apiUrl}/exportar`, {
            responseType: 'blob'
        }).subscribe({
            next: (blob) => {
                const fecha = new Date().toISOString().slice(0, 10);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Carta_Menu_${fecha}.xlsx`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error exportando carta:', error);
            }
        });
    }

    /**
     * Importar carta desde un archivo Excel
     */
    importarCarta(file: File): Observable<ImportacionResultado> {
        const formData = new FormData();
        formData.append('archivo', file);

        return this.http.post<ImportacionResultado>(`${this.apiUrl}/importar`, formData).pipe(
            catchError((error) => {
                console.error('Error importando carta:', error);
                return throwError(() => ({
                    success: false,
                    error: error.error?.error || 'Error al importar la carta'
                }));
            })
        );
    }
}
