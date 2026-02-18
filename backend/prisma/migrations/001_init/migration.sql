-- CreateEnum
CREATE TYPE "EstadoMesa" AS ENUM ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'PAGADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('PENDIENTE', 'COMPLETADA', 'CANCELADA');

-- CreateTable "Usuario"
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "Usuario_email_idx" on "Usuario"("email");
CREATE INDEX "Usuario_activo_idx" on "Usuario"("activo");

-- CreateTable "Rol"
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "Rol_activo_idx" on "Rol"("activo");

-- CreateTable "UsuarioRol"
CREATE TABLE "UsuarioRol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("rolId") REFERENCES "Rol" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioRol_usuarioId_rolId_key" on "UsuarioRol"("usuarioId", "rolId");
CREATE INDEX "UsuarioRol_usuarioId_idx" on "UsuarioRol"("usuarioId");
CREATE INDEX "UsuarioRol_rolId_idx" on "UsuarioRol"("rolId");

-- CreateTable "Permiso"
CREATE TABLE "Permiso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable "Categoria"
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "Categoria_activo_idx" on "Categoria"("activo");

-- CreateTable "Subcategoria"
CREATE TABLE "Subcategoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Subcategoria_nombre_categoriaId_key" on "Subcategoria"("nombre", "categoriaId");
CREATE INDEX "Subcategoria_categoriaId_idx" on "Subcategoria"("categoriaId");
CREATE INDEX "Subcategoria_activo_idx" on "Subcategoria"("activo");

-- CreateTable "CategoriaGasto"
CREATE TABLE "CategoriaGasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "CategoriaGasto_activo_idx" on "CategoriaGasto"("activo");

-- CreateTable "Producto"
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE SET NULL
);

-- CreateIndex
CREATE INDEX "Producto_categoriaId_idx" on "Producto"("categoriaId");
CREATE INDEX "Producto_activo_idx" on "Producto"("activo");
CREATE INDEX "Producto_nombre_idx" on "Producto"("nombre");

-- CreateTable "GrupoModificador"
CREATE TABLE "GrupoModificador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "requerido" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "GrupoModificador_activo_idx" on "GrupoModificador"("activo");

-- CreateTable "OpcionModificador"
CREATE TABLE "OpcionModificador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "precioAdicional" REAL NOT NULL DEFAULT 0,
    "grupoId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("grupoId") REFERENCES "GrupoModificador" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "OpcionModificador_grupoId_idx" on "OpcionModificador"("grupoId");

-- CreateTable "Mesa"
CREATE TABLE "Mesa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL UNIQUE,
    "capacidad" INTEGER NOT NULL,
    "estado" "EstadoMesa" NOT NULL DEFAULT 'DISPONIBLE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "Mesa_estado_idx" on "Mesa"("estado");
CREATE INDEX "Mesa_activo_idx" on "Mesa"("activo");

-- CreateTable "Orden"
CREATE TABLE "Orden" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mesaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "total" REAL NOT NULL DEFAULT 0,
    "descuento" REAL NOT NULL DEFAULT 0,
    "propina" REAL NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compledatAt" TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("mesaId") REFERENCES "Mesa" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT
);

-- CreateIndex
CREATE INDEX "Orden_mesaId_idx" on "Orden"("mesaId");
CREATE INDEX "Orden_usuarioId_idx" on "Orden"("usuarioId");
CREATE INDEX "Orden_estado_idx" on "Orden"("estado");
CREATE INDEX "Orden_createdAt_idx" on "Orden"("createdAt");

-- CreateTable "OrdenProducto"
CREATE TABLE "OrdenProducto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("ordenId") REFERENCES "Orden" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT
);

-- CreateIndex
CREATE INDEX "OrdenProducto_ordenId_idx" on "OrdenProducto"("ordenId");
CREATE INDEX "OrdenProducto_productoId_idx" on "OrdenProducto"("productoId");

-- CreateTable "Pago"
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordenId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'COMPLETADO',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("ordenId") REFERENCES "Orden" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "Pago_ordenId_idx" on "Pago"("ordenId");

-- CreateTable "Gasto"
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibo" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT
);

-- CreateIndex
CREATE INDEX "Gasto_categoriaId_idx" on "Gasto"("categoriaId");
CREATE INDEX "Gasto_usuarioId_idx" on "Gasto"("usuarioId");
CREATE INDEX "Gasto_fecha_idx" on "Gasto"("fecha");
CREATE INDEX "Gasto_activo_idx" on "Gasto"("activo");

-- CreateTable "Proveedor"
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "contacto" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "Proveedor_activo_idx" on "Proveedor"("activo");

-- CreateTable "Compra"
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedorId" TEXT NOT NULL,
    "numeroDocumento" TEXT,
    "monto" REAL NOT NULL,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'COMPLETADA',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE RESTRICT
);

-- CreateIndex
CREATE INDEX "Compra_proveedorId_idx" on "Compra"("proveedorId");

-- CreateTable "Configuracion"
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL UNIQUE,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "Configuracion_clave_idx" on "Configuracion"("clave");
