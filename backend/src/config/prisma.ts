import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

// Caché de clientes Prisma por tenant
const prismaClients = new Map<string, PrismaClient>();

/**
 * Obtiene o crea un cliente Prisma para un tenant específico
 * 
 * Para Supabase: Usa la misma BD pero con aislamiento a nivel de schema/tabla
 * Para desarrollo local: Cada tenant tiene su BD separada
 * 
 * Nota: El aislamiento de datos se garantiza mediante:
 * 1. JWT con tenantId embebido
 * 2. Middleware que valida tenantId
 * 3. Futuro: Filtros automáticos por tenantId en Prisma
 */
export function getPrismaClient(tenantId: string): PrismaClient {
  if (prismaClients.has(tenantId)) {
    return prismaClients.get(tenantId)!;
  }

  const baseUrl = config.databaseUrl;
  
  // Detectar si es Supabase (pooler) o BD local
  const isSupabase = baseUrl.includes('pooler.supabase.com') || baseUrl.includes('supabase.co');
  
  let tenantDatabaseUrl = baseUrl;
  
  // Solo cambiar BD si NO es Supabase
  if (!isSupabase) {
    const urlObj = new URL(baseUrl);
    const dbName = urlObj.pathname.substring(1); // Remove leading slash
    
    // Crear nueva URL con el nombre del tenant como BD
    const tenantDbName = dbName.includes('_') 
      ? `${dbName}_${tenantId}` 
      : `${dbName}_${tenantId}`;
    
    urlObj.pathname = `/${tenantDbName}`;
    tenantDatabaseUrl = urlObj.toString();
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: tenantDatabaseUrl,
      },
    },
  });

  prismaClients.set(tenantId, prisma);

  return prisma;
}

/**
 * Desconecta un cliente Prisma
 */
export async function disconnectPrisma(tenantId: string): Promise<void> {
  const prisma = prismaClients.get(tenantId);
  if (prisma) {
    await prisma.$disconnect();
    prismaClients.delete(tenantId);
  }
}

/**
 * Desconecta todos los clientes Prisma
 */
export async function disconnectAllPrisma(): Promise<void> {
  for (const [tenantId, prisma] of prismaClients) {
    await prisma.$disconnect();
  }
  prismaClients.clear();
}

/**
 * Obtiene la URL de base de datos para un tenant (en desarrollo)
 */
export function getTenantDatabaseUrl(tenantId: string): string {
  const baseUrl = config.databaseUrl;
  const urlObj = new URL(baseUrl);
  const dbName = urlObj.pathname.substring(1);
  
  const tenantDbName = dbName.includes('_') 
    ? `${dbName}_${tenantId}`
    : `${dbName}_${tenantId}`;
  
  urlObj.pathname = `/${tenantDbName}`;
  return urlObj.toString();
}
