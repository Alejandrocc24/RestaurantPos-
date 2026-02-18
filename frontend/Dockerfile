# Multi-stage build para Angular Frontend

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar Angular para producción
RUN npm run build:prod

# Stage 2: Servir con Nginx
FROM nginx:alpine

# Copiar configuración nginx personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar build compilado
COPY --from=builder /app/dist/heladeria-frontend/browser /usr/share/nginx/html

# Crear healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/index.html || exit 1

# Exponer puerto
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
