import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from '../config/index.js';

export class SocketService {
  private static io: Server;

  public static init(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: config.isDevelopment
          ? ['http://localhost:4200', 'http://localhost:3000', 'http://127.0.0.1:4200', 'http://127.0.0.1:3000']
          : process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

      // Permitir que los clientes se unan a salas específicas (ej: tenantId o mesaId)
      socket.on('joinRoom', (room: string) => {
        socket.join(room);
        console.log(`[Socket.io] Cliente ${socket.id} se unió a la sala: ${room}`);
      });

      socket.on('leaveRoom', (room: string) => {
        socket.leave(room);
        console.log(`[Socket.io] Cliente ${socket.id} abandonó la sala: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
      });
    });

    console.log('[Socket.io] Servidor inicializado correctamente');
  }

  public static getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.io no ha sido inicializado');
    }
    return this.io;
  }

  // Método de ayuda para emitir eventos a salas específicas
  public static emitToRoom(room: string, event: string, payload: any) {
    if (this.io) {
      this.io.to(room).emit(event, payload);
    }
  }

  // Método de ayuda para emitir a todos los clientes (ej. mensajes globales)
  public static emitGlobal(event: string, payload: any) {
    if (this.io) {
      this.io.emit(event, payload);
    }
  }
}
