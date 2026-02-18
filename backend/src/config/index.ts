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

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  adminDatabaseUrl: process.env.ADMIN_DATABASE_URL || '',

  // Features
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Validar variables requeridas
if (!config.databaseUrl && config.isProduction) {
  throw new Error('DATABASE_URL no está definida en variables de entorno');
}

if (!config.jwtSecret && config.isProduction) {
  throw new Error('JWT_SECRET no está definida en variables de entorno');
}
