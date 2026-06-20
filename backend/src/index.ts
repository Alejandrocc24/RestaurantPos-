import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { config } from './config/index.js';
import { customCorsOrigin } from './config/cors.js';
import { loggerMiddleware } from './middleware/request.js';
import { errorMiddleware } from './middleware/auth.js';
import apiRoutes from './routes/index.js';
import { BackupService } from './services/backup.service.js';
import { SocketService } from './services/socket.service.js';

const app = express();
const httpServer = createServer(app);

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet para security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: customCorsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  })
);

// Morgan para logging HTTP
app.use(morgan('combined'));

// Body parsers
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
// Cookie parser (para refresh tokens en cookies HttpOnly)
app.use(cookieParser());

// Middleware de logging personalizado
app.use(loggerMiddleware);

// ============================================
// RUTAS
// ============================================

app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'RestaurantPOS API v1.0.0',
    status: 'running',
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada`,
  });
});

// Error handler
app.use(errorMiddleware);

// ============================================
// INICIAR SERVIDOR
// ============================================

async function startServer() {
  try {
    BackupService.init();

    // Inicializar Socket.IO
    SocketService.init(httpServer);

    httpServer.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║     RestaurantPOS API iniciado        ║
╠════════════════════════════════════════╣
║  🚀 Servidor en puerto ${config.port}              
║  📁 Ambiente: ${config.nodeEnv}                 
║  🔐 JWT Secret: ${config.jwtSecret.substring(0, 10)}...   
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibida, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibida, cerrando servidor...');
  process.exit(0);
});

startServer();

export default app;
