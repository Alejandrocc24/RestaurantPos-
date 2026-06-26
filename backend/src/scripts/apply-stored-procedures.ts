/**
 * Aplica stored procedures de prisma/migrations/004 y 005.
 * Uso:
 *   npm run db:sp              → DEV_DATABASE_URL (desarrollo)
 *   npm run db:sp -- --test    → TEST_DATABASE_URL (pruebas)
 *   npm run db:sp -- --prod    → PROD_DATABASE_URL (producción)
 *   npm run db:sp -- --all     → las tres BDs
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../../prisma/migrations');

const SP_FILES = [
  '004_add_cargar_datos_iniciales_function/migration.sql',
  '005_add_stored_procedures/migration.sql',
];

const REQUIRED_FUNCTIONS = [
  'generate_cuid',
  'cargar_datos_iniciales',
  'crear_orden_mesa',
  'obtener_orden_activa_mesa',
  'cobrar_orden_total',
  'actualizar_cantidades_orden',
  'transferir_productos_mesa',
  'crear_venta',
];

type TargetEnv = 'dev' | 'test' | 'prod';

const ENV_URLS: Record<TargetEnv, string | undefined> = {
  dev: process.env.DEV_DATABASE_URL,
  test: process.env.TEST_DATABASE_URL,
  prod: process.env.PROD_DATABASE_URL,
};

function parseTargets(): TargetEnv[] {
  const args = process.argv.slice(2);
  if (args.includes('--all')) return ['dev', 'test', 'prod'];
  if (args.includes('--test')) return ['test'];
  if (args.includes('--prod')) return ['prod'];
  return ['dev'];
}

function ensurePgbouncer(url: string): string {
  if (!url.includes('pooler.supabase.com') && !url.includes(':6543')) return url;
  const parsed = new URL(url);
  if (!parsed.searchParams.has('pgbouncer')) {
    parsed.searchParams.set('pgbouncer', 'true');
  }
  return parsed.toString();
}

function splitStatements(sql: string): string[] {
  return sql
    .split(/(?=CREATE OR REPLACE FUNCTION)/g)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('CREATE OR REPLACE FUNCTION'));
}

async function applyToTarget(label: TargetEnv, url: string): Promise<void> {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  console.log(`\n🔄 [${label.toUpperCase()}] Aplicando stored procedures...`);

  try {
    for (const file of SP_FILES) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Archivo no encontrado: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      const statements = splitStatements(sql);
      console.log(`📄 [${label}] ${file} (${statements.length} función(es))`);
      for (const stmt of statements) {
        const name = stmt.match(/FUNCTION public\.(\w+)/)?.[1]
          ?? stmt.match(/FUNCTION (\w+)/)?.[1]
          ?? 'unknown';
        await prisma.$executeRawUnsafe(stmt);
        console.log(`   ✅ ${name}`);
      }
    }

    const missing: string[] = [];
    for (const fn of REQUIRED_FUNCTIONS) {
      const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS(
          SELECT 1 FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = $1
        ) as exists`,
        fn
      );
      if (!rows[0]?.exists) missing.push(fn);
    }

    if (missing.length > 0) {
      throw new Error(`Funciones faltantes en ${label}: ${missing.join(', ')}`);
    }

    console.log(`✅ [${label.toUpperCase()}] Stored procedures OK (8/8)`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const targets = parseTargets();
  const failures: string[] = [];

  for (const target of targets) {
    const rawUrl = ENV_URLS[target];
    if (!rawUrl) {
      failures.push(`${target}: variable ${target === 'dev' ? 'DEV' : target === 'test' ? 'TEST' : 'PROD'}_DATABASE_URL no configurada`);
      continue;
    }
    try {
      await applyToTarget(target, ensurePgbouncer(rawUrl));
    } catch (err) {
      failures.push(`${target}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (failures.length > 0) {
    console.error('\n❌ Errores:');
    failures.forEach((f) => console.error(`   - ${f}`));
    process.exit(1);
  }

  console.log(`\n✅ Sync completado en: ${targets.join(', ')}`);
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
