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
 * Genera un JWT token
 */
export function generateToken(payload: JwtPayload): string {
  const secret = config.jwtSecret || 'your-secret-key-change-in-production';
  const options: any = {
    expiresIn: config.jwtExpiresIn,
  };
  return jwt.sign(payload, secret, options);
}

/**
 * Verifica y decodifica un JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
