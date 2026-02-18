# Arquitectura Multi-Tenant

## 🎯 Concepto

Esta aplicación implementa una arquitectura **DATABASE-PER-TENANT**, donde cada cliente (restaurante) tiene su propia base de datos PostgreSQL completamente independiente.

```
┌─────────────────────────────────────────┐
│         Frontend Angular                │
│         (Cliente compartido)            │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│      Vercel / Render Backend            │
│  (Single API para todos los tenants)    │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼────┐  ┌────▼────┐  ┌───▼─────┐
   │ BD      │  │ BD      │  │ BD      │
   │ Tenant1 │  │ Tenant2 │  │ Tenant3 │
   │PostgreSQL  │PostgreSQL  │PostgreSQL 
   └─────────┘  └─────────┘  └─────────┘
```

---

## 🔐 Aislamiento de Datos

### ✅ Garantía de Privacidad

**Ningún usuario puede acceder a datos de otro tenant** porque:

1. **BD separada por tenant**
   - Cada tenant conecta a su propia base de datos
   - Imposible query cross-tenant

2. **Validación en middleware**
   ```typescript
   // El middleware inyecta el cliente Prisma correcto
   req.prisma = getPrismaClient(tenantId);
   // Solo queries a esa BD
   ```

3. **JWT contiene tenantId**
   - El token solo es válido para ese tenant
   - No se puede "hackear" un token de otro tenant

4. **Sin datos compartidos**
   - Cada tenant: usuarios, productos, mesas, órdenes, gastos
   - Tabla compartida: solo config de servidor (opcional)

---

## 💾 Estructura de Bases de Datos

### Desarrollo Local
```
PostgreSQL Server
├── restaurante_tenant-001
│   ├── usuario, rol, usuariorol
│   ├── producto, categoria, mesa
│   ├── orden, ordenpro ducto, pago
│   └── gasto, categoríagasto, etc.
├── restaurante_tenant-002
│   └── (mismas tablas)
└── restaurante_tenant-003
    └── (mismas tablas)
```

### En Producc ión (Render/Vercel)
```
Database PostgreSQL en Render
├── database_tenant_1
├── database_tenant_2
└── database_tenant_3
```

---

## 🔑 Flujo de Autenticación Multi-Tenant

### 1. Login

```
Frontend envía:
{
  "email": "camarero@restaurante1.com",
  "password": "pass123",
  "tenantId": "restaurant-1"  ← Identificador del negocio
}
```

### 2. Backend valida

```typescript
// middleware/auth.ts
export function optionalTenantMiddleware(req, res, next) {
  const tenantId = req.body.tenantId;
  req.tenantId = tenantId;
  req.prisma = getPrismaClient(tenantId); // ← Conecta a BD del tenant
  next();
}
```

### 3. Autenticación

```typescript
// services/auth.service.ts
async login(email, password, tenantId) {
  // Busca usuario EN LA BD DEL TENANT
  const user = await this.prisma.usuario.findUnique({
    where: { email }
  });
  
  // Si existe, genera JWT con tenantId
  return generateToken({
    userId: user.id,
    email: user.email,
    tenantId  // ← Incluido en token
  });
}
```

### 4. JWT Token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
{
  "userId": "user-123",
  "email": "camarero@restaurante1.com",
  "tenantId": "restaurant-1"  ← Crítico
}.
[signature]
```

### 5. Próximas requests

```
Frontend envía:
Authorization: Bearer eyJhbGc...

Backend decodifica token:
  - Extrae tenantId
  - Conecta a BD correcta
  - Valida request contra esa BD
```

---

## 🏗️ Implementación en Código

### Inyección de Cliente Prisma

```typescript
// src/config/prisma.ts
export function getPrismaClient(tenantId: string): PrismaClient {
  // Cache para no crear múltiples conexiones
  if (prismaClients.has(tenantId)) {
    return prismaClients.get(tenantId)!;
  }

  // Construir URL específica del tenant
  const baseUrl = process.env.DATABASE_URL;
  const tenantUrl = `${baseUrl}_${tenantId}`;
  
  // Crear cliente Prisma
  const prisma = new PrismaClient({
    datasources: {
      db: { url: tenantUrl }
    }
  });
  
  prismaClients.set(tenantId, prisma);
  return prisma;
}
```

### Middleware de Auth

```typescript
// src/middleware/auth.ts
export function authMiddleware(req, res, next) {
  // 1. Validar JWT
  const token = req.headers.authorization.split(' ')[1];
  const payload = jwt.verify(token, JWT_SECRET);
  
  // 2. Extraer tenantId del JWT
  const tenantId = payload.tenantId;
  
  // 3. Inyectar cliente Prisma del tenant
  req.tenantId = tenantId;
  req.prisma = getPrismaClient(tenantId);
  
  // 4. Request continúa con BD del tenant
  next();
}
```

### Controlador

```typescript
// src/controllers/producto.controller.ts
static async getAll(req: Request, res: Response) {
  // req.prisma siempre es del tenant correcto
  const productos = await req.prisma.producto.findMany();
  res.json(productos);
}
```

---

## 🔐 Seguridad: Casos Potenciales

### ✅ Caso 1: Intruso trata de acceder a datos de otro tenant

```
Frontend hacker envía:
{
  "email": "camarero@restaurante1.com",
  "token": "token-válido-del-tenant-1",
  "tenantId": "restaurant-2"  ← ¡Cambió el tenant!
}

Backend valida:
  ✗ Token decodificado tiene tenantId = "restaurant-1"
  ✗ Request dice tenantId = "restaurant-2"
  → 401 Unauthorized
```

### ✅ Caso 2: Intenta falsificar un JWT

```
Hacker genera JWT con:
{
  "userId": "user-123",
  "tenantId": "restaurant-2"
}

Backend decodifica:
  ✗ Firma no coincide (no conoce JWT_SECRET)
  → 401 Unauthorized
```

### ✅ Caso 3: Logra JWT válido pero de otro tenant

```
Tiene JWT legítimo del tenant-1

Intenta acceder a /api/productos

Middleware:
  1. Decodifica JWT → tenantId = "restaurant-1"
  2. req.prisma = getPrismaClient("restaurant-1")
  3. Query solo ejecuta contra BD del restaurant-1
  
  ✗ Imposible acceder a restaurant-2
```

---

## 🚀 Escalabilidad

### Opción 1: BD Separadas en Mismo Servidor (Actual)
```
DATABASE_URL = postgresql://localhost/
tenant-1: tenant-1
tenant-2: tenant-2
tenant-n: tenant-n

✅ Simple de implementar
✅ Barato
❌ Punto único de fallo
```

### Opción 2: Servidores PostgreSQL Separados

```typescript
// Modificar getPrismaClient:
const tenantConfigs = {
  'restaurant-1': 'postgresql://server1...',
  'restaurant-2': 'postgresql://server2...',
  'restaurant-3': 'postgresql://server3...',
};

export function getPrismaClient(tenantId: string) {
  const url = tenantConfigs[tenantId];
  // ... crear con esa URL
}
```

✅ Máxima aislación  
✅ Scale independiente  
❌ Más caro  

---

## 📊 Monitoreo Multi-Tenant

```typescript
// Logging
console.log(`${method} ${path} - Tenant: ${tenantId}`);

// Métricas por tenant
const metrics = {
  'restaurant-1': { requests: 1000, dbTime: '150ms' },
  'restaurant-2': { requests: 500, dbTime: '200ms' }
};
```

---

## 🔄 Operaciones Multi-Tenant

### Migrar un tenant a nuevo servidor

```bash
# 1. Crear BD nueva
createdb nueva_bd

# 2. Hacer dump de BD actual
pg_dump restaurante_tenant-1 | psql nueva_db

# 3. Actualizar DATABASE_URL para ese tenant
DATABASE_URL = postgresql://nuevo-server/nueva_db

# 4. Prisma auto-detecta schema
npm run db:push
```

### Agregar nuevo tenant

```bash
# 1. Crear BD
createdb restaurante_tenant-new

# 2. Ejecutar migrations
DATABASE_URL=postgresql://localhost/restaurante_tenant-new npm run db:push

# 3. Seed de datos iniciales
npm run seed -- --tenantId=tenant-new

# 4. Ya disponible
```

---

## 📋 Consideraciones

| Aspecto | Implementación |
|--------|---|
| **Aislamiento datos** | ✅ 100% |
| **Performance** | ✅ Cada tenant en BD separada |
| **Seguridad** | ✅ JWT + tenantId en token |
| **Escalabilidad** | ✅ Agregar BDs según necesario |
| **Costos** | ✅ Crecen con tenants (economia de escala) |
| **Compliance GDPR** | ✅ Dados isolados por tenant |
| **Eliminar tenant** | ✅ Simplemente drop BD |

