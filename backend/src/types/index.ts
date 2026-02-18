// Extensión de Express Request para incluir datos de tenants
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      prisma?: any; // Prisma Client del tenant
    }
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  tenantId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    activo: boolean;
    roles: string[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    skip: number;
    take: number;
    total: number;
  };
}

export interface TenantConfig {
  id: string;
  databaseUrl: string;
  name: string;
}
