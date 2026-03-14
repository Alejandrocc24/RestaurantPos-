import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket!: Socket;
    private joinedRooms = new Set<string>();

    /** Emits when the socket reconnects (components should refresh their data) */
    public readonly onReconnect$ = new Subject<void>();

    constructor(private ngZone: NgZone) {
        this.initSocket();
    }

    private initSocket() {
        // Determine backend URL
        const url = environment.apiUrl ? environment.apiUrl.replace('/api', '') : 'http://localhost:3001';

        this.socket = io(url, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('[SocketService] Conectado al servidor WebSocket:', this.socket.id);

            // Re-join all rooms after reconnection
            if (this.joinedRooms.size > 0) {
                console.log(`[SocketService] Re-uniéndose a ${this.joinedRooms.size} sala(s) después de reconexión`);
                this.joinedRooms.forEach(room => {
                    this.socket.emit('joinRoom', room);
                });
            }

            // Notify all components to refresh their data
            this.ngZone.run(() => {
                this.onReconnect$.next();
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('[SocketService] Desconectado del servidor WebSocket. Razón:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.warn('[SocketService] Error de conexión:', error.message);
        });
    }

    // Permite unirse a una sala específica (ej. para un tenant o una orden)
    public joinRoom(room: string) {
        if (this.socket) {
            this.joinedRooms.add(room);
            this.socket.emit('joinRoom', room);
        }
    }

    // Permite abandonar una sala
    public leaveRoom(room: string) {
        if (this.socket) {
            this.joinedRooms.delete(room);
            this.socket.emit('leaveRoom', room);
        }
    }

    /**
     * Escuchar a un evento específico usando Observable pattern (ideal para Angular).
     * Cada suscripción registra su propio callback, y al desuscribirse
     * solo remueve ESE callback (no afecta a otros suscriptores del mismo evento).
     */
    public listen(eventName: string): Observable<any> {
        return new Observable((subscriber) => {
            if (!this.socket) {
                this.initSocket();
            }

            // Create a unique callback reference for this subscription
            const callback = (data: any) => {
                // Run inside NgZone so Angular picks up the change detection
                this.ngZone.run(() => {
                    subscriber.next(data);
                });
            };

            this.socket.on(eventName, callback);

            // Cleanup: only remove THIS specific callback, not all listeners
            return () => {
                this.socket.off(eventName, callback);
            };
        });
    }

    // Emitir un evento
    public emit(eventName: string, data: any) {
        if (this.socket) {
            this.socket.emit(eventName, data);
        }
    }

    /** Verifica si el socket está conectado */
    public isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // Desconectar manualmente
    public disconnect() {
        if (this.socket) {
            this.joinedRooms.clear();
            this.socket.disconnect();
        }
    }
}
