import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket!: Socket;

    constructor() {
        this.initSocket();
    }

    private initSocket() {
        // Determine backend URL
        const url = environment.apiUrl ? environment.apiUrl.replace('/api', '') : 'http://localhost:3001';

        this.socket = io(url, {
            withCredentials: true,
            autoConnect: true,
            // Se puede enviar información del tenant o token en la conexión inicial si se desea
            // extraHeaders: { 'x-tenant-id': 'tenant_id' }
        });

        this.socket.on('connect', () => {
            console.log('[SocketService] Conectado al servidor WebSocket:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('[SocketService] Desconectado del servidor WebSocket');
        });
    }

    // Permite unirse a una sala específica (ej. para un tenant o una orden)
    public joinRoom(room: string) {
        if (this.socket) {
            this.socket.emit('joinRoom', room);
        }
    }

    // Permite abandonar una sala
    public leaveRoom(room: string) {
        if (this.socket) {
            this.socket.emit('leaveRoom', room);
        }
    }

    // Escuchar a un evento específico usando Observable pattern (ideal para Angular)
    public listen(eventName: string): Observable<any> {
        return new Observable((subscriber) => {
            if (!this.socket) {
                this.initSocket();
            }
            this.socket.on(eventName, (data: any) => {
                subscriber.next(data);
            });

            // Cleanup function
            return () => {
                this.socket.off(eventName);
            };
        });
    }

    // Emitir un evento
    public emit(eventName: string, data: any) {
        if (this.socket) {
            this.socket.emit(eventName, data);
        }
    }

    // Desconectar manualmente
    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
