import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de logging
 */
export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms) [TenantId: ${req.tenantId || 'N/A'}]`
    );
  });

  next();
}

/**
 * Middleware para validar que req.prisma exista
 */
export function ensurePrismaMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.prisma) {
    return res.status(500).json({
      success: false,
      message: 'Client Prisma no inicializado',
    });
  }
  next();
}
