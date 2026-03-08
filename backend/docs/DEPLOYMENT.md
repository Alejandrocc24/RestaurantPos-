# RestaurantPOS Backend - Guía de Despliegue

## 🚀 Desplegando en Vercel

### Pasos:

1. **Crear proyecto en GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/restaurant-pos.git
   git push -u origin main
   ```

2. **Conectar a Vercel**
   - Ir a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Conectar tu repositorio de GitHub
   - Seleccionar root directory: `backend`

3. **Configurar variables de entorno**
   En Vercel (Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=tu-secret-muy-seguro-cambiar-en-produccion
   NODE_ENV=production
   API_URL=https://tu-dominio.vercel.app
   ```

4. **Desplegar**
   - Vercel desplegará automáticamente cuando hagas push a main
   - El `vercel.json` configurará el build automáticamente

### Limitaciones de Vercel (Importante):
- **Timeout de 10 segundos** en plan gratuito
- Prisma genera cliente en tiempo de build ✅ (configurado en `vercel.json`)
- La BD debe ser **externa** (no local)

---

## 🚀 Desplegando en Render

### Pasos:

1. **Crear proyecto en GitHub** (mismo que Vercel)

2. **Conectar a Render**
   - Ir a [render.com](https://render.com)
   - Click en "New +"
   - Seleccionar "Web Service"
   - Conectar repositorio de GitHub
   - Seleccionar rama: `main`

3. **Configurar el servicio**
   - **Name**: `restaurante-pos-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run db:generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (o Pay-As-You-Go para producción)

4. **Configurar variables de entorno**
   En Render (Environment):
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=tu-secret-muy-seguro
   NODE_ENV=production
   API_URL=https://tu-dominio.onrender.com
   ```

5. **Crear base de datos PostgreSQL en Render**
   - En Render, ir a "PostgreSQL"
   - Click "New Database"
   - Copiar la `Internal Database URL` para `DATABASE_URL`

### Ventajas de Render:
- ✅ **Hasta 750 horas gratis/mes**
- ✅ **Ejecución indefinida** (no hay timeouts cortos)
- ✅ **BD PostgreSQL incluida** (en plan gratuito)
- ✅ **SSL automático** para la BD

---

## 📊 Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=cambiar-esto-en-produccion-algo-muy-seguro
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production
API_URL=https://tu-dominio.com

# Admin DB (opcional, para gestión de tenants)
ADMIN_DATABASE_URL=postgresql://...
```

---

## 🔧 Scripts de Utilidad

```bash
# Desarrollo local
npm run dev

# Build
npm run build

# Ejecutar
npm start

# Generar cliente Prisma
npm run db:generate

# Hacer migrations
npm run db:migrate

# Seed inicial
npm run seed
```

---

## 🗄️ Configuración de Base de Datos

### Opción 1: Render PostgreSQL (Recomendado para Render)
1. Crear BD en Render
2. Copiar URL de conexión
3. Asignar a `DATABASE_URL`

### Opción 2: Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a "Database" → "Connection String"
3. Seleccionar "URI" (Prisma)
4. Copiar y asignar a `DATABASE_URL`

### Opción 3: Railway
1. Crear proyecto en [railway.app](https://railway.app)
2. Crear plugin PostgreSQL
3. Copiar connection string
4. Asignar a `DATABASE_URL`

---

## 🔒 Seguridad en Producción

1. **Cambiar JWT_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Usar HTTPS** ✅ (Vercel y Render incluyen)

3. **Variables de entorno** - Nunca usar `.env` en producción

4. **Headers de seguridad** ✅ (Helmet configurado)

5. **CORS restrictivo** - Cambiar `*` por dominio real en `config/index.ts`

6. **Rate limiting** - Agregar en futuro

---

## 🧪 Testear con cURL

```bash
# Health check
curl https://tu-api.vercel.app/api/health

# Login
curl -X POST https://tu-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123",
    "tenantId": "tenant-001"
  }'

# Listar productos (requiere token)
curl https://tu-api.vercel.app/api/productos \
  -H "Authorization: Bearer tu-token-jwt"
```

---

## 📝 Logs en Producción

### Vercel
- Ver en Dashboard → Deployments → Logs

### Render
- Ver en Service → Logs

---

## ⚠️ Problemas Comunes

### "Database connection timeout"
- ✓ Verificar que la URL de BD sea correcta
- ✓ Verificar firewall de BD (whitelist IP)
- ✓ Verificar credenciales

### "Prisma client generation failed"
- ✓ `npm run db:generate` localmente
- ✓ Incluir `node_modules/.prisma` en git (opcional)
- ✓ Limpiar cache: `rm -rf node_modules .prisma`

### "500 Internal Server Error"
- ✓ Ver logs en Vercel/Render
- ✓ Verificar que `req.prisma` esté disponible
- ✓ Verficar que el middlewarer de auth esté siendo usado

---

## 📞 Soporte

- Documentación: Ver [README.md](./README.md)
- Schema: Ver [prisma/SCHEMA_DOCUMENTATION.md](./prisma/SCHEMA_DOCUMENTATION.md)
