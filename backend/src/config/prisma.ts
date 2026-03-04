import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

// Cache de clientes Prisma por tenant
// Esto resuelve el problema de pool exhausto al reutilizar conexiones
const prismaClients = new Map<string, PrismaClient>();

/**
 * Obtiene o crea un cliente Prisma para un tenant específico
 * Usa caching para evitar agotar el pool de conexiones
 */
export function getPrismaClient(tenantId: string): PrismaClient {
  try {
    // Retornar cliente cacheado si existe
    if (prismaClients.has(tenantId)) {
      const cached = prismaClients.get(tenantId)!;
      console.log(`✅ [getPrismaClient] Usando cliente cacheado para tenant: ${tenantId}`);
      return cached;
    }

    const baseUrl = config.databaseUrl;
    
    if (!baseUrl) {
      console.error('❌ [getPrismaClient] DATABASE_URL no está configurada');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
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

    // Crear nuevo cliente Prisma con pool optimization
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: tenantDatabaseUrl,
        },
      },
      // Log: ['query', 'warn', 'error'], // Descomentar para debug
    });

    // Validar que Prisma se creó correctamente
    if (!prisma) {
      throw new Error('Failed to create PrismaClient instance');
    }

    // Guardar en cache
    prismaClients.set(tenantId, prisma);
    console.log(`✅ [getPrismaClient] Cliente Prisma creado y cacheado para tenant: ${tenantId}`);

    return prisma;
  } catch (error: any) {
    console.error(`❌ [getPrismaClient] Error creando cliente Prisma: ${error.message}`);
    throw error;
  }
}

/**
 * Desconecta un cliente Prisma del cache
 */
export async function disconnectPrisma(tenantId: string): Promise<void> {
  const prisma = prismaClients.get(tenantId);
  if (prisma) {
    await prisma.$disconnect();
    prismaClients.delete(tenantId);
    console.log(`✅ [disconnectPrisma] Conexión Prisma cerrada para tenant: ${tenantId}`);
  }
}

/**
 * Desconecta todos los clientes Prisma
 */
export async function disconnectAllPrisma(): Promise<void> {
  for (const [tenantId, prisma] of prismaClients) {
    await prisma.$disconnect();
    console.log(`✅ [disconnectAllPrisma] Conexión Prisma cerrada para tenant: ${tenantId}`);
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
