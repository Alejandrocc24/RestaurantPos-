import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3000',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshJwtExpiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '7d',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  adminDatabaseUrl: process.env.ADMIN_DATABASE_URL || '',

  // Features
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

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
