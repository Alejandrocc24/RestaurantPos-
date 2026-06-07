# RestaurantPos — Contexto del proyecto

## Stack
- Backend: Node.js + Express + TypeScript + Prisma ORM
- Frontend: Angular 19 (standalone components)
- Base de datos: PostgreSQL 17 en Supabase
- Auth: JWT propio (NO Supabase Auth)
- Realtime: Socket.io

## Zona horaria
- El negocio opera en Colombia (America/Bogota, UTC-5)
- SIEMPRE usar `America/Bogota` para fechas, NUNCA `new Date()` sin zona
- Librería aprobada: `date-fns-tz`

## Estructura
- /backend — API Express en puerto 3001
- /frontend — App Angular en puerto 4200
- /backend/prisma/schema.prisma — Schema de la BD
- /backend/src/controllers/ — Controladores de rutas
- /backend/src/services/ — Lógica de negocio

## Reglas importantes
1. NUNCA modificar datos en producción directamente
2. Toda migración de BD debe crear archivo en /backend/prisma/migrations/
3. Los stored procedures están en Supabase — documentar cambios
4. El campo `Orden.compledatAt` es un typo de `completedAt` — pendiente de migrar
5. RLS está desactivado — NO agregar policies sin consultarme primero

## Plan de mejoras pendiente (por orden)
1. Bug zona horaria en venta.controller.ts y cobrarMesa
2. Hashear refreshToken antes de guardar en BD
3. Corregir FK Caja → Usuario en schema.prisma
4. Typo compledatAt → completedAt
5. Cambiar campos JSON de String a Json en Prisma
6. Eliminar console.log en producción
7. Corregir permisos multi-rol en auth.service.ts
8. Enum para OrdenProducto.estado

## Comandos útiles
- `cd backend && npx prisma migrate dev` — correr migración
- `cd backend && npx prisma generate` — regenerar cliente
- `cd backend && npm run dev` — iniciar backend
- `cd frontend && ng serve` — iniciar frontend

## Comportamiento del agente (OBLIGATORIO)
- Actúa directamente. Sin preámbulos, sin explicar lo que vas a hacer.
- Máximo 1 línea de razonamiento antes de cada herramienta.
- NUNCA repitas el mismo pensamiento dos veces.
- NUNCA expliques un cambio línea por línea después de hacerlo.
- Al terminar una tarea, responde solo: "✓ Listo. [qué cambió en 1 línea]"
- Si necesitas leer un archivo para editarlo, léelo y edítalo en el mismo turno.
## Notas de arquitectura
- El cierre de caja se maneja con un modal INLINE en ventas.component.html
  (líneas ~451-587), NO con el componente <app-cerrar-caja>
- cerrar-caja.component.ts existe pero está desconectado del template principal
- No conectar <app-cerrar-caja> al template sin instrucción explícita