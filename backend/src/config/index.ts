import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // JWT
  jwtSecret: isProd 
    ? (process.env.PROD_JWT_SECRET || 'prod-secret-missing') 
    : (process.env.DEV_JWT_SECRET || 'dev-secret-key-2026'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshJwtExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '7d',

  // Database
  databaseUrl: isProd 
    ? (process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || '') 
    : (process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || ''),
  adminDatabaseUrl: isProd
    ? (process.env.PROD_DATABASE_URL || process.env.DATABASE_URL || '') // Fallback a la misma si no hay admin separada
    : (process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || ''),

  // Features
  isProduction: isProd,
  isDevelopment: !isProd,

  // Sistema Desarrollador (oculto para clientes)
  // El usuario y rol de desarrollador pueden hacer login pero NO aparecen en listados,
  // NO pueden ser eliminados ni editados por otros usuarios.
  devEmail: process.env.DEV_EMAIL || 'desarrollador@dev',
  devRoleName: 'Desarrollador',
};

// Validar variables requeridas
if (!config.databaseUrl && config.isProduction) {
  throw new Error('DATABASE_URL no está definida en variables de entorno');
}

if (!config.jwtSecret && config.isProduction) {
  throw new Error('JWT_SECRET no está definida en variables de entorno');
}
