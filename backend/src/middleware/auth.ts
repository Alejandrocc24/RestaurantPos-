import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getPrismaClient } from '../config/prisma.js';
import { JwtPayload } from '../types/index.js';

/**
 * Middleware para extraer tenantId y validar JWT
 * Inyecta el cliente Prisma del tenant en la request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [authMiddleware] No hay token o formato inválido');
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
      });
    }

    const token = authHeader.substring(7);
    console.log('🔐 [authMiddleware] Token recibido, verificando...');

    // Verificar y decodificar el JWT
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    console.log('✅ [authMiddleware] Token verificado. TenantId:', decoded.tenantId, 'UserId:', decoded.userId);

    // Obtener tenantId del token
    const tenantId = decoded.tenantId;
    if (!tenantId) {
      console.error('❌ [authMiddleware] TenantId no encontrado en el token');
      return res.status(401).json({
        success: false,
        message: 'TenantId no encontrado en el token',
      });
    }

    // Asignar en la request
    req.tenantId = tenantId;
    req.userId = decoded.userId;

    // Inyectar cliente Prisma del tenant
    req.prisma = getPrismaClient(tenantId);

    next();
  } catch (error: any) {
    console.error('❌ [authMiddleware] Error en validación de token:', error.name, error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error en autenticación',
    });
  }
}

/**
 * Middleware para rutas públicas (como login y register)
 * Extrae el tenantId del email o del header x-tenant-id
 * Para login/register, el tenantId se extrae automáticamente del dominio del email
 */
export function optionalTenantMiddleware(req: Request, res: Response, next: NextFunction) {
  let tenantId = req.body.tenantId || req.headers['x-tenant-id'];
  
  console.log('🔍 [optionalTenantMiddleware] Buscando tenantId...');
  console.log('  - Body tenantId:', req.body.tenantId);
  console.log('  - Header x-tenant-id:', req.headers['x-tenant-id']);
  
  // Si no hay tenantId, intentar extraerlo del email
  if (!tenantId && req.body.email) {
    const email = req.body.email;
    const emailParts = email.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1].split('.')[0];
      tenantId = domain; // Sin prefijo 'tenant-'
      console.log('  - TenantId extraído del email:', tenantId);
    }
  }

  if (!tenantId) {
    console.error('❌ [optionalTenantMiddleware] No se pudo determinar tenantId');
    return res.status(400).json({
      success: false,
      message: 'No se pudo determinar el tenantId. Proporcione un email válido o incluya x-tenant-id en el header',
    });
  }

  console.log('✅ [optionalTenantMiddleware] TenantId determinado:', tenantId);
  req.tenantId = tenantId;
  req.prisma = getPrismaClient(tenantId);

  next();
}

/**
 * Middleware para manejar errores
 */
export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'El registro ya existe',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro no encontrado',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Referencia inválida',
    });
  }

  // Error general
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
}
