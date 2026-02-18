# 🚀 RestaurantPOS Backend - Guía Rápida de Inicio

## ¿Qué se ha creado?

Un backend **multi-tenant** escalable y seguro para tu RestaurantPOS con:

✅ **Autenticación JWT** con soporte multi-tenant  
✅ **PostgreSQL** como base de datos  
✅ **Prisma ORM** para queries con type-safety  
✅ **Database-per-tenant** para máxima seguridad  
✅ **Listo para Vercel y Render**  

---

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma          # Esquema de BD (15+ tablas)
│   ├── SCHEMA_DOCUMENTATION.md # Doc completa del esquema
│   └── migrations/            # Migrations automáticas
├── src/
│   ├── config/                # Configuración
│   │   ├── index.ts          # Config general
│   │   └── prisma.ts         # Gestor de clientes Prisma
│   ├── middleware/            # Middlewares
│   │   ├── auth.ts           # Autenticación & autorización
│   │   └── request.ts        # Logging y validación
│   ├── controllers/           # Lógica de endpoints
│   │   ├── auth.controller.ts
│   │   ├── producto.controller.ts
│   │   ├── mesa.controller.ts
│   │   └── gasto.controller.ts
│   ├── services/              # Lógica de negocio
│   │   └── auth.service.ts
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── producto.routes.ts
│   │   ├── mesa.routes.ts
│   │   ├── gasto.routes.ts
│   │   └── index.ts          # Agregador de rutas
│   ├── types/                 # Tipos TypeScript
│   ├── utils/                 # Funciones de utilidad
│   │   ├── auth.ts           # Hash, JWT, validaciones
│   │   ├── response.ts       # Formato de respuestas
│   │   └── validation.ts     # Validaciones
│   ├── scripts/               # Scripts útiles
│   │   └── seed.ts           # Datos iniciales
│   └── index.ts              # Punto de entrada
├── .env.example              # Variables de entorno
├── package.json
├── tsconfig.json
├── README.md                 # Documentación principal
├── DEPLOYMENT.md             # Guía de despliegue
└── MULTI_TENANT_ARCHITECTURE.md # Arquitectura multi-tenant

```

---

## ⚡ Quick Start

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar base de datos

Crear archivo `.env`:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/restaurante_tenant_1"
JWT_SECRET="tu-secret-super-seguro-cambiar-en-produccion"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
```

### 3. Crear la base de datos

```bash
# Opción 1: Si existe el servidor PostgreSQL
createdb restaurante_tenant_1

# Opción 2: Si es dev local, usar Docker
docker run --name postgres-restaurante \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=restaurante_tenant_1 \
  -p 5432:5432 \
  -d postgres:latest
```

### 4. Ejecutar migrations

```bash
npm run db:generate
npm run db:push
```

### 5. Seed de datos iniciales

```bash
npm run seed
```

### 6. Iniciar servidor

```bash
npm run dev
```

El servidor estará en: `http://localhost:3000`

---

## 🔐 Credenciales de Prueba (Después del Seed)

```
Email:    admin@example.com
Password: Admin123
TenantId: tenant-001

Email:    gerente@example.com
Password: Gerente123
TenantId: tenant-001

Email:    camarero@example.com
Password: Camarero123
TenantId: tenant-001
```

---

## 📡 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/password` - Cambiar contraseña

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/:id` - Obtener producto
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Mesas
- `GET /api/mesas` - Listar mesas
- `PUT /api/mesas/:id` - Actualizar mesa

### Gastos
- `GET /api/gastos` - Listar gastos (con filtros)
- `POST /api/gastos` - Crear gasto
- `DELETE /api/gastos/:id` - Eliminar gasto

---

## 🧪 Probar con cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123",
    "tenantId": "tenant-001"
  }'
```

### Listar productos (con token JWT)
```bash
curl http://localhost:3000/api/productos \
  -H "Authorization: Bearer [TU_TOKEN_JWT]"
```

---

## 🐳 Con Docker (Opcional)

```bash
# Construir imagen
docker build -t restaurante-pos-backend .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="tu-secret" \
  restaurante-pos-backend
```

---

## 🌍 Despliegue a Producción

### ✅ Vercel (Recomendado para API rápidas)
```bash
npm i -g vercel
vercel
```
Ver: [DEPLOYMENT.md](./DEPLOYMENT.md)

### ✅ Render (Recomendado para aplicaciones)
```bash
# Push a GitHub
git push origin main

# Conectar a Render.com
# Seleccionar backend/ como root directory
```
Ver: [DEPLOYMENT.md](./DEPLOYMENT.md)

### ✅ Railway / Heroku / Otros
Cualquier plataforma que soporte Node.js + PostgreSQL

---

## 🔍 Características Principales

### 🎭 Multi-Tenant
- Cada restaurant tiene su **base de datos independiente**
- Aislamiento total de datos
- Crecimiento escalable

### 🔐 Seguridad
- **Contraseñas hasheadas** con bcrypt
- **JWT tokens** con tenantId
- **Middleware de autenticación** en rutas protegidas
- **Headers de seguridad** con Helmet
- **CORS** configurado

### ⚡ Performance
- **Índices en tablas** para queries rápidas
- **Soft deletes** (nunca perder histórico)
- **Paginación** en listados
- **Caché de clientes Prisma** por tenant

### 📊 Auditoría
- **createdAt/updatedAt** en todas las tablas
- **Logs HTTP** con Morgan
- **Identificación por tenant** en todas las requests

---

## 📚 Documentación Completa

- **[SCHEMA_DOCUMENTATION.md](./prisma/SCHEMA_DOCUMENTATION.md)** - Esquema de BD en detalle
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía de despliegue en Vercel y Render
- **[MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md)** - Arquitectura multi-tenant
- **[README.md](./README.md)** - Info general del proyecto

---

## 🚨 Checklist Antes de Producción

- [ ] Cambiar `JWT_SECRET` a valor aleatorio y seguro
- [ ] Configurar `DATABASE_URL` a BD real (no local)
- [ ] Cambiar CORS origin de `*` a dominio real en `config/index.ts`
- [ ] Agregar `ADMIN_DATABASE_URL` si usarás multi-BD
- [ ] Ejecutar `npm run build` para validar TypeScript
- [ ] Hacer backup de base de datos
- [ ] Configurar logs en Vercel/Render
- [ ] Probar endpoints en producción
- [ ] Configurar HTTPS/SSL ✅ (automático en Vercel/Render)

---

## 🤔 Próximos Pasos Recomendados

1. **Agregar más endpoints**
   - Órdenes (`/api/ordenes`)
   - Usuarios (`/api/usuarios`)
   - Roles (`/api/roles`)

2. **Mejorar autorización**
   - Agregar `@Permission()` decorator
   - Validar permisos en cada endpoint

3. **Agregar reportes**
   - `/api/reportes/ventas`
   - `/api/reportes/gastos`

4. **Rate limiting**
   - Limitar requests por IP/tenant

5. **Caché**
   - Redis para caché de productos

6. **Webhooks**
   - Notificar eventos (nueva orden, etc.)

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo agrego un nuevo endpoint?**
A: Crea un controlador en `src/controllers/`, las rutas en `src/routes/` y luego agreg alas a `src/routes/index.ts`.

**P: ¿Todos los tenants usan la misma API?**
A: Sí, es una sola API. El `tenantId` en el JWT indica a cuál base de datos conectar.

**P: ¿Puedo cambiar de PostgreSQL a otra BD?**
A: Sí, Prisma soporta MySQL, SQLite, etc. Solo cambia `provider` en `prisma/schema.prisma`.

**P: ¿Cómo backupear un tenant?**
A: `pg_dump restaurante_tenant_1 > backup.sql` (comando PostgreSQL).

**P: ¿Es seguro este sistema?**
A: Sí. Database-per-tenant es la forma más segura. Ver [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md).

---

## 📞 Soporte

- Documentación: Ver carpeta de docs
- Problemas: Revisar logs en Vercel/Render
- Errores: Verificar `.env` y BD connection

---

¡Listo para empezar! 🎉
