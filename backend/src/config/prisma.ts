import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

// Cache de clientes Prisma por tenant
// Esto resuelve el problema de pool exhausto al reutilizar conexiones
const prismaClients = new Map<string, PrismaClient>();

/**
 * Supabase pooler (puerto 6543) requiere pgbouncer=true para evitar
 * "prepared statement already exists" con Prisma.
 */
function ensurePgbouncerParams(url: string): string {
  if (!url.includes('pooler.supabase.com') && !url.includes(':6543')) {
    return url;
  }
  const parsed = new URL(url);
  if (!parsed.searchParams.has('pgbouncer')) {
    parsed.searchParams.set('pgbouncer', 'true');
  }
  return parsed.toString();
}

/**
 * Busca la URL de base de datos para un tenant específico.
 * Estrategia de búsqueda:
 *   1. Variable de entorno DATABASE_URL_{tenantId} (ej: DATABASE_URL_dulcemomento)
 *   2. Fallback a DATABASE_URL general (para compatibilidad / desarrollo)
 */
function resolveTenantDatabaseUrl(tenantId: string): string {
  // Determinar prefijo según el ambiente
  const prefix = config.isProduction ? 'PROD_' : 'DEV_';
  
  // 1. Buscar variable específica con prefijo: DEV_DATABASE_URL_dulcemomento o PROD_DATABASE_URL_dulcemomento
  const envKey = `${prefix}DATABASE_URL_${tenantId}`;
  const tenantUrl = process.env[envKey];

  if (tenantUrl) {
    console.log(`✅ [resolveTenantDatabaseUrl] Usando ${envKey} para tenant: ${tenantId} (${config.nodeEnv})`);
    return ensurePgbouncerParams(tenantUrl);
  }

  // 2. Fallback a la URL general del ambiente (config ya resolvió si es DEV o PROD)
  const baseUrl = config.databaseUrl;
  if (!baseUrl) {
    throw new Error(`No se encontró ${prefix}DATABASE_URL ni ${envKey}. Configura el entorno "${config.nodeEnv}".`);
  }

  console.log(`⚠️ [resolveTenantDatabaseUrl] No se encontró ${envKey}, usando fallback ${prefix}DATABASE_URL para tenant: ${tenantId}`);
  return ensurePgbouncerParams(baseUrl);
}

/**
 * Obtiene o crea un cliente Prisma para un tenant específico.
 * Cada tenant tiene su propia conexión a su proyecto Supabase.
 * Usa caching para evitar agotar el pool de conexiones.
 */
export function getPrismaClient(tenantId: string): PrismaClient {
  try {
    // Retornar cliente cacheado si existe
    if (prismaClients.has(tenantId)) {
      return prismaClients.get(tenantId)!;
    }

    // Resolver la URL de la BD para este tenant
    const tenantDatabaseUrl = resolveTenantDatabaseUrl(tenantId);

    // Crear nuevo cliente Prisma
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: tenantDatabaseUrl,
        },
      },
      // log: ['query', 'warn', 'error'], // Descomentar para debug
    });

    if (!prisma) {
      throw new Error('Failed to create PrismaClient instance');
    }

    // Guardar en cache
    prismaClients.set(tenantId, prisma);
    console.log(`✅ [getPrismaClient] Cliente Prisma creado y cacheado para tenant: ${tenantId}`);

    return prisma;
  } catch (error: any) {
    console.error(`❌ [getPrismaClient] Error creando cliente Prisma para tenant "${tenantId}": ${error.message}`);
    throw error;
  }
}

/**
 * Lista todos los tenants configurados por variable de entorno.
 * Busca todas las variables DATABASE_URL_* en process.env.
 */
export function getConfiguredTenants(): string[] {
  const envPrefix = config.isProduction ? 'PROD_' : 'DEV_';
  const prefix = `${envPrefix}DATABASE_URL_`;
  
  return Object.keys(process.env)
    .filter(key => key.startsWith(prefix))
    .map(key => key.substring(prefix.length));
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
 * Obtiene la URL de base de datos resuelta para un tenant
 */
export function getTenantDatabaseUrl(tenantId: string): string {
  return resolveTenantDatabaseUrl(tenantId);
}
