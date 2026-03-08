# Instrucciones para desarrollo local

## 1. PostgreSQL Local

Si NO tienes PostgreSQL instalado, usa Docker:

```bash
# Crear contenedor PostgreSQL
docker run --name restaurante-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=restaurante_tenant_1 \
  -p 5432:5432 \
  -d postgres:15

# Para detener:
# docker stop restaurante-postgres

# Para volver a iniciar:
# docker start restaurante-postgres
```

## 2. Crear archivo .env

```bash
cp .env.example .env
```

Editar `.env` con:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurante_tenant_1"
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
API_URL="http://localhost:3000"
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Inicializar Base de Datos

```bash
# Generar Prisma Client
npm run db:generate

# Crear tablas en BD
npm run db:push

# Insertar datos de ejemplo
npm run seed
```

## 5. Iniciar servidor

```bash
npm run dev
```

Irá a `http://localhost:3000`

## ✅ Credenciales para probar

Después de ejecutar `npm run seed`:

```
admin@example.com / Admin123
gerente@example.com / Gerente123
camarero@example.com / Camarero123
```

Todos con `tenantId: tenant-001`

---

## Ubicación: `/backend/.env`

Crear este archivo localmente.
