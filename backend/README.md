# RestaurantPOS Backend

Backend multi-tenant para un sistema de punto de venta de restaurante.

## Características

- ✅ Autenticación con JWT
- ✅ Multi-tenant con bases de datos separadas
- ✅ Gestión de productos, mesas, órdenes y gastos
- ✅ Control de roles y permisos
- ✅ PostgreSQL como base de datos
- ✅ Desplegable en Vercel y Render

## Instalación

```bash
npm install
```

## Configuración

1. Crear archivo `.env` basado en `.env.example`
2. Configurar las URLs de base de datos
3. Generar secret de JWT

```bash
npm run db:generate
npm run db:push
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
src/
  ├── config/          # Configuraciones globales
  ├── middleware/      # Middlewares
  ├── routes/          # Rutas de API
  ├── controllers/     # Controladores de lógica
  ├── services/        # Servicios de negocio
  ├── prisma/          # Cliente Prisma dinámico
  ├── types/           # Tipos TypeScript
  ├── utils/           # Utilidades
  └── index.ts         # Punto de entrada
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/refresh` - Refrescar token

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/:id` - Obtener producto
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Mesas
- `GET /api/mesas` - Listar mesas
- `PUT /api/mesas/:id` - Actualizar mesa

### Órdenes
- `GET /api/ordenes` - Listar órdenes
- `POST /api/ordenes` - Crear orden
- `PUT /api/ordenes/:id` - Actualizar orden

### Gastos
- `GET /api/gastos` - Listar gastos
- `POST /api/gastos` - Crear gasto
- `DELETE /api/gastos/:id` - Eliminar gasto

## Gestión Multi-tenant

El sistema identificará el tenant por:
1. `tenantId` en el header de autenticación
2. Base de datos separada para cada tenant
3. Cada consulta se ejecuta contra la BD del tenant correspondiente

## Despliegue

### Vercel
```bash
vercel deploy
```

### Render
```bash
git push
```

Configura en la plataforma:
- Comando build: `npm run build`
- Comando start: `npm start`
