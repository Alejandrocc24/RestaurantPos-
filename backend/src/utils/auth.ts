import { createHash } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JwtPayload } from '../types/index.js';

/**
 * Genera un hash bcrypt de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verifica una contraseña contra su hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Helper: Calcula los segundos hasta la medianoche de una zona horaria específica (por defecto Colombia, UTC-5, offset=+300)
 */
function getSecondsUntilMidnightOffset(offsetMinutes = 300): number {
  const now = new Date();
  const clientLocalNow = new Date(now.getTime() - (offsetMinutes * 60000));
  const year = clientLocalNow.getUTCFullYear();
  const month = clientLocalNow.getUTCMonth();
  const day = clientLocalNow.getUTCDate();
  
  // Medianoche del Siguiente día en tiempo del cliente, expresada en UTC puro
  const localNextMidnightUTC = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
  
  // Volver al UTC absoluto
  const nextMidnightAbsoluteUTC = new Date(localNextMidnightUTC.getTime() + (offsetMinutes * 60000));
  
  return Math.max(3600, Math.floor((nextMidnightAbsoluteUTC.getTime() - now.getTime()) / 1000)); // Minimo 1 hora por seguridad
}

/**
 * Genera un JWT token
 */
export function generateToken(payload: JwtPayload): string {
  const secret = config.jwtSecret || 'your-secret-key-change-in-production';
  // Expiración dinámica para que caduque a la media noche (12 AM hora local)
  const options: any = {
    expiresIn: getSecondsUntilMidnightOffset(300), // 300 minutos = UTC-5
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Genera un refresh token (JWT) con expiración más larga
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const secret = config.jwtSecret || 'your-secret-key-change-in-production';
  const options: any = {
    expiresIn: (config as any).refreshJwtExpiresIn || '7d',
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Verifica y decodifica un JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

/**
 * Genera un hash SHA-256 de un token para almacenamiento seguro en BD
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
