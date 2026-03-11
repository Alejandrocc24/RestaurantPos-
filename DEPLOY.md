# 🚀 Guía de Despliegue — RestaurantPOS

## Resumen

| Componente       | Tecnología                                | Se despliega en |
|------------------|-------------------------------------------|-----------------|
| **Backend**      | Node.js + Express + Prisma + Socket.IO    | **Render**      |
| **Frontend**     | Angular 19 + Angular Material             | **Vercel**      |
| **Base de datos**| PostgreSQL                                | **Supabase** (ya configurado) |

```
┌──────────────────────────────┐         ┌────────────────────────────────┐
│     Frontend (Angular 19)    │         │    Backend (Express/Node.js)   │
│     Vercel - Static/CDN      │────────▶│    Render - Web Service        │
│     restaurantpos.vercel.app │  API +  │    restaurantpos-backend       │
│                              │  Socket │    .onrender.com               │
└──────────────────────────────┘         └───────────────┬────────────────┘
                                                         │ Prisma ORM
                                         ┌───────────────▼────────────────┐
                                         │     PostgreSQL (Supabase)      │
                                         │     Multi-tenant               │
                                         │     dulcemomento | buenosaires │
                                         └────────────────────────────────┘
```

**Rama de despliegue:** `main`

---

## Paso 1 — Subir el código a GitHub

Asegúrate de que todo esté en la rama `main` y subido:

```bash
git add -A
git commit -m "preparar para deploy"
git push origin main
```

---

## Paso 2 — Desplegar el Backend en Render

### 2.1 Crear el servicio

1. Ir a [dashboard.render.com](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Seleccionar **"Build and deploy from a Git repository"** → Next
4. Conectar tu cuenta de GitHub si no lo has hecho
5. Buscar y seleccionar el repositorio **`RestaurantPos-`**
6. Llenar los campos así:

| Campo              | Qué poner                                             |
|--------------------|--------------------------------------------------------|
| **Name**           | `restaurantpos-backend`                                |
| **Region**         | `Oregon (US West)` — la más cercana a Supabase         |
| **Branch**         | `main`                                                 |
| **Root Directory** | `backend`                                              |
| **Runtime**        | `Node`                                                 |
| **Build Command**  | `npm install --include=dev && npx prisma generate && npm run build`  |
| **Start Command**  | `npm start`                                            |
| **Instance Type**  | `Free` (o `Starter $7/mes` para evitar suspensiones)   |

7. **NO darle "Create" todavía** — primero agrega las variables de entorno (paso 2.2)

### 2.2 Agregar variables de entorno

Más abajo en la misma página de creación, hay una sección que dice **"Environment Variables"**.  
Click en **"Add Environment Variable"** y agrega **una por una** las siguientes:

> 💡 **¿Qué es esto?** Son los mismos valores que tienes en tu archivo `backend/.env`, pero puestos en Render para que el backend los lea en producción.

Agrega estas variables una por una. En Render verás dos campos por cada una: **Key** (izquierda) y **Value** (derecha):

**Servidor:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `JWT_SECRET` | *(generar uno nuevo, ver abajo)* |
| `JWT_EXPIRES_IN` | `24h` |
| `DEV_EMAIL` | `desarrollador@dev` |
| `FRONTEND_URL` | *(dejarlo vacío por ahora, se llena en el paso 4)* |

**Base de datos** — copiar los valores de tu `backend/.env`:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | *(copiar de tu .env)* |
| `DATABASE_URL_dulcemomento` | *(copiar de tu .env)* |
| `DATABASE_URL_buenosaires` | *(copiar de tu .env)* |

**Supabase** — copiar los valores de tu `backend/.env`:

| Key | Value |
|-----|-------|
| `SUPABASE_URL_dulcemomento` | `https://wdqawukeutapmddourhn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY_dulcemomento` | *(copiar de tu .env)* |
| `SUPABASE_URL_buenosaires` | `https://tuuyiohscdtsxocoqrhf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY_buenosaires` | *(copiar de tu .env)* |

#### ¿Cómo generar el JWT_SECRET para producción?

Abre una terminal y ejecuta:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Eso te da una cadena larga y segura. Cópiala y pégala como valor de `JWT_SECRET` en Render.

> ⚠️ **No uses el mismo JWT_SECRET que tienes en desarrollo.** Genera uno nuevo para producción.

### 2.3 Crear el servicio

Una vez que hayas agregado todas las variables → Click en **"Create Web Service"**

Render comenzará a construir y desplegar. Espera unos minutos. Cuando termine, verás un URL como:

```
https://restaurantpos-backend.onrender.com
```

### 2.4 Verificar que el backend funciona

Abre esa URL en el navegador. Deberías ver:

```json
{
  "message": "RestaurantPOS API v1.0.0",
  "status": "running"
}
```

Si ves eso, **el backend está funcionando** ✅

---

## Paso 3 — Desplegar el Frontend en Vercel

### 3.1 Crear el proyecto

1. Ir a [vercel.com](https://vercel.com) e iniciar sesión con GitHub
2. Click en **"Add New..."** → **"Project"**
3. Buscar y seleccionar el repositorio **`RestaurantPos-`**
4. **Importante:** Vercel te preguntará cómo configurar el proyecto. Llenar así:

| Campo                  | Qué poner                              |
|------------------------|----------------------------------------|
| **Project Name**       | `restaurantpos` (o el nombre que quieras) |
| **Framework Preset**   | `Other`                                |
| **Root Directory**     | Click en **"Edit"** → escribir `frontend` |
| **Build Command**      | `npm run build`                        |
| **Output Directory**   | `dist/restaurantpos-frontend/browser`  |
| **Install Command**    | `npm install`                          |

5. Click en **"Deploy"**

### 3.2 Esperar el despliegue

Vercel construirá el proyecto. Cuando termine, te dará tu URL, algo como:

```
https://restaurantpos.vercel.app
```

Abre esa URL — deberías ver la **pantalla de login** de RestaurantPOS ✅

---

## Paso 4 — Conectar Frontend ↔ Backend

Ahora que ambos están desplegados, necesitas conectarlos:

### 4.1 Decirle al Backend cuál es el Frontend

1. Ir a Render → Tu servicio `restaurantpos-backend` → **"Environment"**
2. Buscar la variable `FRONTEND_URL`
3. Poner como valor la URL del frontend en Vercel:
   ```
   https://restaurantpos.vercel.app
   ```
4. Click en **"Save Changes"** — el backend se re-desplegará automáticamente

### 4.2 Verificar que el Frontend apunte al Backend correcto

El archivo `frontend/src/environments/environment.prod.ts` ya tiene configurada la URL:

```typescript
apiUrl: 'https://restaurantpos-backend.onrender.com/api'
```

**Si tu backend en Render tiene un nombre diferente**, cambia esa línea para que coincida con la URL real de Render y haz push de nuevo.

---

## Paso 5 — Probar todo

1. Abrir la URL del frontend (ej: `https://restaurantpos.vercel.app`)
2. Iniciar sesión con un usuario existente
3. Verificar que cargan las mesas, los productos, etc.
4. Si algo falla, revisa los logs:
   - **Backend:** Render → Tu servicio → **"Logs"**
   - **Frontend:** Vercel → Tu proyecto → **"Deployments"** → click en el último → **"Functions"**

---

## Notas Importantes

### 🕐 Plan Free de Render (Backend)

El plan free de Render **suspende el backend** después de ~15 minutos sin recibir peticiones. Cuando alguien entra después de eso, la primera carga tarda **30-50 segundos** mientras se reactiva.

**Opciones:**
- **Free:** Gratis, pero con el delay de arranque. Funciona bien para pruebas.
- **Starter ($7/mes):** El backend nunca se suspende. Recomendado para producción real.

> El frontend en Vercel **NO tiene este problema** — siempre carga rápido porque es un sitio estático en CDN.

### 🔌 WebSockets (Socket.IO)

- Render soporta WebSockets nativamente, no hay que configurar nada extra
- El frontend se conecta automáticamente al backend
- Si ves errores de WebSocket en consola, verifica que `FRONTEND_URL` esté bien configurado en Render

### 🔒 Seguridad

- **NUNCA** subas el archivo `.env` al repositorio (ya está en `.gitignore`)
- Las variables sensibles van **solo** en Render (Environment Variables)
- Usa un `JWT_SECRET` **diferente** para producción
- Las `SUPABASE_SERVICE_ROLE_KEY` dan acceso TOTAL a la DB — mantenlas en secreto

### 📦 Agregar un nuevo tenant (restaurante)

1. Crear un nuevo proyecto en Supabase
2. Ejecutar `init_schema.sql` en la nueva base de datos
3. En Render → Environment, agregar 3 variables nuevas:
   ```
   DATABASE_URL_nuevocliente          = postgresql://...
   SUPABASE_URL_nuevocliente          = https://XXXXX.supabase.co
   SUPABASE_SERVICE_ROLE_KEY_nuevocliente = eyJhbGci...
   ```
4. El backend detectará automáticamente el nuevo tenant por el dominio del email

### 🔄 Re-despliegues automáticos

Cada vez que hagas `git push origin main`:
- **Render** re-despliega el backend automáticamente
- **Vercel** re-despliega el frontend automáticamente

No necesitas hacer nada manual.

---

## Resumen de URLs

| Qué              | URL ejemplo                                        |
|-------------------|----------------------------------------------------|
| **Frontend**      | `https://restaurantpos.vercel.app`                 |
| **Backend API**   | `https://restaurantpos-backend.onrender.com/api`   |
| **Backend raíz**  | `https://restaurantpos-backend.onrender.com`       |
| **Supabase DM**   | `https://wdqawukeutapmddourhn.supabase.co`         |
| **Supabase BA**   | `https://tuuyiohscdtsxocoqrhf.supabase.co`         |

---

## Estructura del proyecto

```
RestaurantPos-/
├── backend/                  ← Se despliega en RENDER
│   ├── src/                  
│   ├── prisma/schema.prisma  
│   ├── package.json          
│   ├── tsconfig.json         
│   └── .env                  ← Solo para desarrollo local (NO se sube)
├── frontend/                 ← Se despliega en VERCEL
│   ├── src/
│   │   └── environments/
│   │       ├── environment.ts       ← Config LOCAL (localhost:3001)
│   │       └── environment.prod.ts  ← Config PRODUCCIÓN (render URL)
│   ├── angular.json
│   ├── vercel.json           ← Configuración de Vercel
│   └── package.json
├── init_schema.sql           ← Script para inicializar la DB
└── DEPLOY.md                 ← Este archivo
```
