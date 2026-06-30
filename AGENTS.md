# RestaurantPos — Sistema POS para Restaurantes

Sistema de punto de venta multi-tenant para restaurantes con gestión de mesas, órdenes, productos, ventas y reportes.

## Stack tecnológico
- **Backend:** Node.js + TypeScript + Express + Prisma ORM
- **Base de datos:** PostgreSQL en Supabase
- **Frontend:** Angular 19 con SSR (Server-Side Rendering)
- **Deploy:** Backend en Render, Frontend en Vercel
- **Tiempo real:** Socket.IO para cocina y mesas
- **Auth:** JWT con middleware propio

## Estructura del proyecto
backend/

src/

controllers/   # Lógica de negocio por entidad

routes/        # Definición de endpoints REST

middleware/    # auth.ts, request.ts

services/      # Servicios externos (backup, google-drive, socket)

config/        # prisma.ts, index.ts

types/         # Tipos TypeScript globales

utils/         # response.ts, auth.ts, validation.ts

prisma/

schema.prisma  # Modelos de base de datos

migrations/    # Historial de migraciones
frontend/

src/app/

mesas/         # Gestión de mesas y órdenes (módulo principal)

productos/     # Inventario, categorías, grupos modificadores

ventas/        # Historial y cierre de caja

cocina/        # Vista de cocina en tiempo real

configuracion/ # Roles, usuarios, permisos

gastos/        # Gastos y proveedores

services/      # Servicios Angular (api, auth, socket, supabase)

shared/        # Toast, modales, pipes, guards
## Convenciones de código
- Controladores: un archivo por entidad (`orden.controller.ts`)
- Rutas: siguen patrón REST estándar
- Respuestas: siempre usar `utils/response.ts` (nunca `res.json()` directo)
- Auth: middleware `auth.ts` protege rutas privadas
- Errores: capturar con try/catch y pasar a `next(error)`
- Frontend: componentes standalone con módulos por feature

## Base de datos (Prisma + Supabase)
- Multi-tenant: cada restaurante tiene su propio `restauranteId`
- Modelos principales: Usuario, Rol, Mesa, Orden, Producto, Categoria, Venta, Caja
- Siempre filtrar por `restauranteId` en queries
- Migraciones en `backend/prisma/migrations/`

## Flujo principal
1. Usuario abre mesa → crea Orden
2. Agrega productos con modificadores opcionales
3. Cocina ve órdenes en tiempo real (Socket.IO)
4. Cierra mesa → genera Venta → actualiza Caja

## Variables de entorno importantes (backend)
- `DATABASE_URL` — conexión Supabase
- `JWT_SECRET` — firma de tokens
- `PORT` — puerto del servidor

## Comandos útiles
```bash
# Backend
cd backend && npm run dev        # Desarrollo
cd backend && npm run build      # Compilar TypeScript
cd backend && npx prisma studio  # Ver BD visual

# Frontend  
cd frontend && ng serve          # Desarrollo
cd frontend && ng build          # Build producción
```

## Ramas Git
- `main` — producción
- `desarrollo` — rama principal de trabajo
- `prueba` — testing
