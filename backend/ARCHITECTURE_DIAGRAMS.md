# Diagrama de Arquitectura - RestaurantPOS Multi-Tenant

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENTES / FRONTENDS                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ Restaurant 1    │  │ Restaurant 2    │  │ Restaurant N    ││
│  │ Angular App     │  │ Angular App     │  │ Angular App     ││
│  │ tenant-001      │  │ tenant-002      │  │ tenant-nnn      ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘│
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            └────────────┬───────┴────────┬──────────┘
                         │                │
            ╔════════════▼════════════════▼════════════╗
            ║                                          ║
            ║   VERCEL / RENDER (Single Endpoint)    ║
            ║   https://api.restaurante.com           ║
            ║                                          ║
            ║  ┌──────────────────────────────────┐  ║
            ║  │  Express.js Backend              │  ║
            ║  ├──────────────────────────────────┤  ║
            ║  │ GET /api/productos               │  ║
            ║  │ POST /api/auth/login             │  ║
            ║  │ PUT /api/mesas/:id               │  ║
            ║  │ DELETE /api/gastos/:id           │  ║
            ║  └──────────────────────────────────┘  ║
            ║                                          ║
            ║  ┌──────────────────────────────────┐  ║
            ║  │  Middleware de Tenant            │  ║
            ║  │  - Decodifica JWT                │  ║
            ║  │  - Extrae tenantId               │  ║
            ║  │  - Inyecta Prisma Client         │  ║
            ║  └──────────────────────────────────┘  ║
            ║                                          ║
            ║  ┌──────────────────────────────────┐  ║
            ║  │  Prisma ORM (Type-Safe)          │  ║
            ║  │    ├─ Queries preparadas         │  ║
            ║  │    ├─ Migrations automáticas     │  ║
            ║  │    └─ Validación de tipos        │  ║
            ║  └──────────────────────────────────┘  ║
            ║                                          ║
            ╚════════════════════════════════════════╝
                        │        │        │
         ┌──────────────┼────────┼────────┼──────────┐
         │              │        │        │          │
         │     ┌────────▼──────┐ │        │          │
         │     │                │ │        │          │
         ▼     ▼                ▼ ▼        ▼          ▼
    
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ PostgreSQL   │ │ PostgreSQL   │ │ PostgreSQL   │
   │ Render.com   │ │ Render.com   │ │ Render.com   │
   │              │ │              │ │              │
   │ restaurant_  │ │ restaurant_  │ │ restaurant_  │
   │ tenant_001   │ │ tenant_002   │ │ tenant_nnn   │
   │              │ │              │ │              │
   │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐│
   │ │ Usuarios │ │ │ │ Usuarios │ │ │ │ Usuarios ││
   │ │ Productos│ │ │ │ Productos│ │ │ │ Productos││
   │ │ Órdenes  │ │ │ │ Órdenes  │ │ │ │ Órdenes  ││
   │ │ Gastos   │ │ │ │ Gastos   │ │ │ │ Gastos   ││
   │ │ etc...   │ │ │ │ etc...   │ │ │ │ etc...   ││
   │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘│
   └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔄 Flujo de una Petición Autenticada

```
1. CLIENTE ENVÍA REQUEST
   ┌────────────────────────────────────────┐
   │ GET /api/productos                     │
   │ Authorization: Bearer eyJhbGc...       │
   │ X-Tenant-Id: tenant-001                │
   └────────────┬───────────────────────────┘
                │
                ▼
2. SERVIDOR RECIBE
   ┌────────────────────────────────────────┐
   │ app.use(authMiddleware)                │
   └────────────┬───────────────────────────┘
                │
                ▼
3. MIDDLEWARE DECODIFICA JWT
   ┌────────────────────────────────────────┐
   │ jwt.verify(token, JWT_SECRET)          │
   │ {                                      │
   │   userId: "user-123",                  │
   │   tenantId: "tenant-001"  ← CLAVE     │
   │ }                                      │
   └────────────┬───────────────────────────┘
                │
                ▼
4. OBTIENE CLIENTE PRISMA DEL TENANT
   ┌────────────────────────────────────────┐
   │ req.prisma = getPrismaClient(          │
   │   "tenant-001"                         │
   │ )                                      │
   │                                        │
   │ Conecta a:                             │
   │ postgresql://host/restaurante_         │
   │ tenant_001                             │
   └────────────┬───────────────────────────┘
                │
                ▼
5. CONTROLADOR EJECUTA QUERY
   ┌────────────────────────────────────────┐
   │ req.prisma.producto.findMany()         │
   │                                        │
   │ ✓ Solo accede a datos de tenant-001    │
   │ ✓ Imposible acceder a otros tenants    │
   └────────────┬───────────────────────────┘
                │
                ▼
6. DEVUELVE RESPUESTA
   ┌────────────────────────────────────────┐
   │ {                                      │
   │   "success": true,                     │
   │   "data": [                            │
   │     { id: "p-1", nombre: "Café" }      │
   │   ]                                    │
   │ }                                      │
   └────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Carpetas Detallada

```
backend/
│
├── 📋 Configuración del Proyecto
│   ├── package.json              ← Dependencias y scripts
│   ├── tsconfig.json             ← Configuración TypeScript
│   ├── .env.example              ← Variables de entorno
│   ├── .gitignore                ← Archivos ignorados
│   ├── vercel.json               ← Config Vercel
│   ├── Procfile                  ← Config Render
│   │
│   └── 📚 Documentación
│       ├── README.md             ← Info general
│       ├── QUICK_START.md        ← Guía rápida START here ⭐
│       ├── DEPLOYMENT.md         ← Despliegue paso a paso
│       └── MULTI_TENANT_ARCHITECTURE.md ← Cómo funciona multi-tenant
│
├── prisma/
│   ├── schema.prisma             ← Esquema BD (15 tablas)
│   ├── SCHEMA_DOCUMENTATION.md   ← Doc de cada tabla
│   │
│   └── migrations/
│       └── 001_init/
│           └── migration.sql     ← Migration SQL inicial
│
└── src/
    │
    ├── 🔧 config/
    │   ├── index.ts              ← Config global (DB, JWT, etc)
    │   └── prisma.ts             ← Gestor de clientes Prisma
    │
    ├── 🛡️ middleware/
    │   ├── auth.ts               ← Autenticación y JWT
    │   └── request.ts            ← Logging y validación
    │
    ├── 🎛️ controllers/
    │   ├── auth.controller.ts    ← Lógica de login/registro
    │   ├── producto.controller.ts ← Crud de productos
    │   ├── mesa.controller.ts     ← Gestión de mesas
    │   └── gasto.controller.ts    ← Registro de gastos
    │
    ├── 🔨 services/
    │   └── auth.service.ts        ← Lógica de negocio auth
    │
    ├── 🛣️ routes/
    │   ├── index.ts              ← Agregador de rutas
    │   ├── auth.routes.ts        ← Rutas de auth
    │   ├── producto.routes.ts    ← Rutas de productos
    │   ├── mesa.routes.ts        ← Rutas de mesas
    │   └── gasto.routes.ts       ← Rutas de gastos
    │
    ├── 📝 types/
    │   └── index.ts              ← Tipos TypeScript globales
    │
    ├── 🔧 utils/
    │   ├── auth.ts               ← Hash, JWT, criptografía
    │   ├── response.ts           ← Formato de respuestas
    │   └── validation.ts         ← Validación de datos
    │
    ├── 📄 scripts/
    │   └── seed.ts               ← Datos iniciales de BD
    │
    └── 🚀 index.ts               ← PUNTO DE ENTRADA
                                    (Express app principal)
```

---

## 🔐 Flujo de Seguridad Multi-Tenant

```
USUARIO INTENTA LOGIN A TENANT 1
│
├─ Solicita acceso a: /api/auth/login
│  {
│    "email": "user@tenant1.com",
│    "password": "pass",
│    "tenantId": "tenant-001"
│  }
│
├─ Backend verifica credenciales EN BD DE TENANT-001
│  ├─ getPrismaClient("tenant-001")
│  │   → Conecta a postgre://host/restaurante_tenant_001
│  │
│  ├─ usuario.findUnique({ email... })
│  │   → Query SOLO en restaurante_tenant_001
│  │
│  └─ Si es válido, genera JWT con:
│     JWT = sign({
│       userId: "u-123",
│       tenantId: "tenant-001"  ← EMBEBIDO EN TOKEN
│     })
│
├─ Devuelve: { accessToken, user }
│
└─ PETICIÓN FUTURA
   ├─ Cliente envía: Authorization: Bearer [JWT]
   │
   ├─ authMiddleware decodifica:
   │  {
   │    userId: "u-123",
   │    tenantId: "tenant-001"
   │  }
   │
   ├─ Inyecta: req.prisma = getPrismaClient("tenant-001")
   │
   ├─ Controlador ejecuta queries SOLO contra BD de tenant-001
   │
   └─ ✅ AISLAMIENTO GARANTIZADO


INTENTO DE HACKEO: Usuario de tenant-001 trata de acceder a tenant-002
│
├─ Envía token válido de tenant-001
│  Header: Authorization: Bearer [token-tenant-001]
│
├─ Middleware decodifica:
│  ✓ Token válido (firma correcta)
│  ✓ Extrae: tenantId = "tenant-001"
│
├─ Aunque intente acceder a /api/productos?tenantId=tenant-002
│  ├─ El middleware YA asignó:
│  │  req.tenantId = "tenant-001"  (del token)
│  │  req.prisma = getPrismaClient("tenant-001")
│  │
│  └─ Query ejecuta contra BD de tenant-001
│     ✗ No hay acceso a datos de tenant-002
│
└─ ❌ ATAQUE BLOQUEADO
```

---

## 📦 Tabla de Datos Multi-Tenant

```
PostgreSQL Server
│
├─ restaurante_tenant_001
│  │
│  ├── usuario
│  │   ├── id | email | nombre | password
│  │   ├── 1  | user1@t1.com | Usuario 1 | hash1
│  │   └── ...
│  │
│  ├── producto
│  │   ├── id | nombre | precio
│  │   ├── 1  | Café   | 2.50
│  │   └── ...
│  │
│  ├── mesa
│  │   ├── id | numero | estado
│  │   ├── 1  | 1      | DISPONIBLE
│  │   └── ...
│  │
│  └── ... (más tablas)
│
├─ restaurante_tenant_002
│  │
│  ├── usuario
│  │   ├── id | email | nombre | password
│  │   ├── 1  | user1@t2.com | Usuario 2 | hash2
│  │   └── ...
│  │
│  ├── producto
│  │   ├── id | nombre | precio
│  │   ├── 1  | Pizza  | 12.00
│  │   └── ...
│  │
│  └── ...
│
└─ restaurante_tenant_nnn
   └── ... (mismo patrón)

GARANTÍA: ❌ SIN DATOS COMPARTIDOS
- Usuarios de tenant-001 NO pueden ver usuarios de tenant-002
- Órdenes de tenant-001 NO aparecen en tenant-002
- Cada tenant: AISLAMIENTO TOTAL
```

---

## ✅ Checklist de Seguridad

```
Implementado:
✓ JWT con tenantId embebido
✓ Database-per-tenant
✓ Middleware de autenticación en rutas protegidas
✓ Inyección de Prisma Client correcto por tenant
✓ Contraseñas hasheadas con bcrypt
✓ CORS configurado
✓ Helmet para security headers
✓ Morgan para logging de requests
✓ Validación de inputs
✓ Soft deletes (nunca perder datos)

Próximos pasos opcionales:
□ Rate limiting por tenant
□ IP whitelisting
□ Notificaciones de acceso sospechoso
□ Auditoría completa de todas las queries
□ Encriptación de datos sensibles
□ Backup automático por tenant
```

---

## 📊 Comparación: Architecturas Alternativas

```
┌─────────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Aspecto             │ Database-Per-    │ Schema-Per-      │ Row-Level        │
│                     │ Tenant (ACTUAL)  │ Tenant           │ Security         │
├─────────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Aislamiento datos   │ ✅ Máximo        │ ✓ Bueno          │ ⚠️ Riesgo error  │
│ Seguridad           │ ✅ Máxima        │ ✓ Buena          │ ⚠️ Complic. RLS  │
│ Performance         │ ✅ Óptimo        │ ✓ Muy bueno      │ ✓ Bueno          │
│ Escalabilidad BD    │ ✅ Fácil (N BDs) │ ✓ Moderada       │ ✗ Limitada       │
│ Costo              │ 💰 Medio          │ 💰 Bajo          │ 💰 Bajo          │
│ Complejidad código  │ ✅ Media         │ ✓ Baja           │ ✗ Alta           │
│ Backup individual   │ ✅ Sí            │ ✗ No             │ ✗ No             │
│ Cumplimiento GDPR   │ ✅ Excelente     │ ✓ Bueno          │ ⚠️ Posible riesgo│
└─────────────────────┴──────────────────┴──────────────────┴──────────────────┘

DECISIÓN: Database-Per-Tenant es la mejor relación
seguridad/complejidad/performance para restaurantes.
```

---

## 🚀 Escalabilidad Futura

```
FASE 1: Actual (Database-Per-Tenant, 1 servidor PostgreSQL)
└─ Rápido de implementar ✓
└─ Escalable hasta ~100 tenants

FASE 2: Multi-servidor (Cada tenant o grupo en servidor distinto)
├─ tenants 1-30 → postgresql-server-1
├─ tenants 31-60 → postgresql-server-2
└─ tenants 61+ → postgresql-server-3

FASE 3: Sharding (Datos de cada tenant particionados)
└─ Shard A, B, C en servidores distintos
└─ Para +1000 tenants

FASE 4: Global (Servidores por región)
├─ Región Latinoamérica
├─ Región Europa
└─ Región Asia
```

