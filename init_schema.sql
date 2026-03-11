-- ============================================================
-- RESTAURANTPOS - SCRIPT COMPLETO DE INICIALIZACIÓN
-- Incluye: Estructura + Datos base (Roles, Usuario Dev, Mesas)
-- 
-- USO: Copiar y ejecutar en el SQL Editor de un nuevo proyecto Supabase
-- NOTA: El email del desarrollador es desarrollador@dev
--       Password: Desarrollo123
-- ============================================================

-- ========================
-- PARTE 1: TIPOS ENUM
-- ========================

CREATE TYPE "EstadoMesa" AS ENUM ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO');
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'PAGADA');
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'OTRO');
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO', 'REEMBOLSADO');
CREATE TYPE "TipoComentario" AS ENUM ('GENERAL', 'PROBLEMA', 'COMENTARIO_CLIENTE', 'NOTA_INTERNA', 'ADVERTENCIA');
CREATE TYPE "Severidad" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'CRITICA');
CREATE TYPE "EstadoCompra" AS ENUM ('PENDIENTE', 'COMPLETADA', 'CANCELADA');

-- ========================
-- PARTE 2: TABLAS
-- ========================

CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsuarioRol" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "permisos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subcategoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subcategoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoriaGasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CategoriaGasto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "subcategoria" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "comentarios" TEXT DEFAULT '[]',
    "especial" BOOLEAN NOT NULL DEFAULT false,
    "gruposModificadores" TEXT DEFAULT '[]',
    "configuracionGrupos" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrupoModificador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "requerido" BOOLEAN NOT NULL DEFAULT false,
    "cobrar_precio" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GrupoModificador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpcionModificador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precioAdicional" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grupoId" TEXT NOT NULL,
    "productoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpcionModificador_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Mesa" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "estado" "EstadoMesa" NOT NULL DEFAULT 'DISPONIBLE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "posicion" TEXT,
    "ubicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Mesa_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Orden" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "propina" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notas" TEXT,
    "visibleCocina" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compledatAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Orden_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrdenProducto" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrdenProducto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'COMPLETADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "ordenId" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'completada',
    "metodoPago" TEXT NOT NULL,
    "cantidadProductos" INTEGER NOT NULL DEFAULT 0,
    "productosJson" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "tipoComentario" "TipoComentario" NOT NULL DEFAULT 'GENERAL',
    "severidad" "Severidad" NOT NULL DEFAULT 'NORMAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComentarioPreestablecido" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ComentarioPreestablecido_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "proveedorId" TEXT,
    "proveedorPersonalizado" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibo" TEXT,
    "observaciones" TEXT,
    "salio_de_caja" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "monto_inicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_final" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "usuario_apertura_id" TEXT,
    "usuario_cierre_id" TEXT,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "total_gastos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "numeroDocumento" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'COMPLETADA',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'string',
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_GrupoModificadorToProducto" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- ========================
-- PARTE 3: ÍNDICES
-- ========================

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");
CREATE INDEX "Usuario_activo_idx" ON "Usuario"("activo");
CREATE INDEX "UsuarioRol_usuarioId_idx" ON "UsuarioRol"("usuarioId");
CREATE INDEX "UsuarioRol_rolId_idx" ON "UsuarioRol"("rolId");
CREATE UNIQUE INDEX "UsuarioRol_usuarioId_rolId_key" ON "UsuarioRol"("usuarioId", "rolId");
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");
CREATE INDEX "Rol_activo_idx" ON "Rol"("activo");
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");
CREATE INDEX "Categoria_activo_idx" ON "Categoria"("activo");
CREATE INDEX "Subcategoria_categoriaId_idx" ON "Subcategoria"("categoriaId");
CREATE INDEX "Subcategoria_activo_idx" ON "Subcategoria"("activo");
CREATE UNIQUE INDEX "Subcategoria_nombre_categoriaId_key" ON "Subcategoria"("nombre", "categoriaId");
CREATE UNIQUE INDEX "CategoriaGasto_nombre_key" ON "CategoriaGasto"("nombre");
CREATE INDEX "CategoriaGasto_activo_idx" ON "CategoriaGasto"("activo");
CREATE INDEX "Producto_categoriaId_idx" ON "Producto"("categoriaId");
CREATE INDEX "Producto_activo_idx" ON "Producto"("activo");
CREATE INDEX "Producto_nombre_idx" ON "Producto"("nombre");
CREATE INDEX "GrupoModificador_activo_idx" ON "GrupoModificador"("activo");
CREATE INDEX "OpcionModificador_grupoId_idx" ON "OpcionModificador"("grupoId");
CREATE INDEX "OpcionModificador_productoId_idx" ON "OpcionModificador"("productoId");
CREATE UNIQUE INDEX "Mesa_numero_key" ON "Mesa"("numero");
CREATE INDEX "Mesa_estado_idx" ON "Mesa"("estado");
CREATE INDEX "Mesa_activo_idx" ON "Mesa"("activo");
CREATE INDEX "Orden_mesaId_idx" ON "Orden"("mesaId");
CREATE INDEX "Orden_usuarioId_idx" ON "Orden"("usuarioId");
CREATE INDEX "Orden_estado_idx" ON "Orden"("estado");
CREATE INDEX "Orden_createdAt_idx" ON "Orden"("createdAt");
CREATE INDEX "OrdenProducto_ordenId_idx" ON "OrdenProducto"("ordenId");
CREATE INDEX "OrdenProducto_productoId_idx" ON "OrdenProducto"("productoId");
CREATE INDEX "Pago_ordenId_idx" ON "Pago"("ordenId");
CREATE INDEX "Venta_mesaId_idx" ON "Venta"("mesaId");
CREATE INDEX "Venta_usuarioId_idx" ON "Venta"("usuarioId");
CREATE INDEX "Venta_fecha_idx" ON "Venta"("fecha");
CREATE INDEX "Venta_estado_idx" ON "Venta"("estado");
CREATE INDEX "Comentario_ordenId_idx" ON "Comentario"("ordenId");
CREATE INDEX "Comentario_tipoComentario_idx" ON "Comentario"("tipoComentario");
CREATE INDEX "Comentario_severidad_idx" ON "Comentario"("severidad");
CREATE INDEX "Comentario_activo_idx" ON "Comentario"("activo");
CREATE INDEX "ComentarioPreestablecido_activo_idx" ON "ComentarioPreestablecido"("activo");
CREATE INDEX "Gasto_categoriaId_idx" ON "Gasto"("categoriaId");
CREATE INDEX "Gasto_usuarioId_idx" ON "Gasto"("usuarioId");
CREATE INDEX "Gasto_proveedorId_idx" ON "Gasto"("proveedorId");
CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");
CREATE INDEX "Gasto_activo_idx" ON "Gasto"("activo");
CREATE INDEX "Caja_estado_idx" ON "Caja"("estado");
CREATE INDEX "Caja_fecha_apertura_idx" ON "Caja"("fecha_apertura");
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");
CREATE INDEX "Proveedor_activo_idx" ON "Proveedor"("activo");
CREATE INDEX "Compra_proveedorId_idx" ON "Compra"("proveedorId");
CREATE UNIQUE INDEX "Configuracion_clave_key" ON "Configuracion"("clave");
CREATE INDEX "Configuracion_clave_idx" ON "Configuracion"("clave");
CREATE UNIQUE INDEX "_GrupoModificadorToProducto_AB_unique" ON "_GrupoModificadorToProducto"("A", "B");
CREATE INDEX "_GrupoModificadorToProducto_B_index" ON "_GrupoModificadorToProducto"("B");

-- ========================
-- PARTE 4: FOREIGN KEYS
-- ========================

ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subcategoria" ADD CONSTRAINT "Subcategoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OpcionModificador" ADD CONSTRAINT "OpcionModificador_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "GrupoModificador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpcionModificador" ADD CONSTRAINT "OpcionModificador_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Orden" ADD CONSTRAINT "Orden_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrdenProducto" ADD CONSTRAINT "OrdenProducto_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrdenProducto" ADD CONSTRAINT "OrdenProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaGasto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "_GrupoModificadorToProducto" ADD CONSTRAINT "_GrupoModificadorToProducto_A_fkey" FOREIGN KEY ("A") REFERENCES "GrupoModificador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_GrupoModificadorToProducto" ADD CONSTRAINT "_GrupoModificadorToProducto_B_fkey" FOREIGN KEY ("B") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================
-- PARTE 5: DATOS INICIALES
-- ========================

-- 5.1 ROLES (6 roles: 1 oculto "Desarrollador" + 5 visibles)

-- ROL DESARROLLADOR (OCULTO - no visible para clientes)
INSERT INTO "Rol" ("id", "nombre", "descripcion", "permisos", "activo", "createdAt", "updatedAt") VALUES (
    'rol_desarrollador_001',
    'Desarrollador',
    'Rol de sistema - acceso total para soporte técnico',
    ARRAY[
        'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
        'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
        'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
        'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
        'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
        'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
        'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.dividir', 'mesas.modo_edicion',
        'cocina.ver', 'cocina.preparar', 'cocina.completar',
        'caja.ver', 'caja.abrir', 'caja.cerrar',
        'movimientos.ver', 'movimientos.crear',
        'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
        'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.eliminar',
        'dashboard.ver',
        'reportes.ver', 'reportes.ventas', 'reportes.productos', 'reportes.gastos', 'reportes.exportar',
        'configuracion.ver', 'configuracion.editar', 'configuracion.impresoras'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ROL ADMINISTRADOR (visible para clientes)
INSERT INTO "Rol" ("id", "nombre", "descripcion", "permisos", "activo", "createdAt", "updatedAt") VALUES (
    'rol_administrador_001',
    'Administrador',
    'Acceso completo al sistema con todos los permisos',
    ARRAY[
        'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
        'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
        'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
        'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
        'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.anular',
        'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cerrar',
        'mesas.ver', 'mesas.gestionar', 'mesas.transferir', 'mesas.dividir', 'mesas.modo_edicion',
        'cocina.ver', 'cocina.preparar', 'cocina.completar',
        'caja.ver', 'caja.abrir', 'caja.cerrar',
        'movimientos.ver', 'movimientos.crear',
        'gastos.ver', 'gastos.crear', 'gastos.editar', 'gastos.eliminar',
        'proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.eliminar',
        'dashboard.ver',
        'reportes.ver', 'reportes.ventas', 'reportes.productos', 'reportes.gastos', 'reportes.exportar',
        'configuracion.ver', 'configuracion.editar', 'configuracion.impresoras'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ROL GERENTE
INSERT INTO "Rol" ("id", "nombre", "descripcion", "permisos", "activo", "createdAt", "updatedAt") VALUES (
    'rol_gerente_001',
    'Gerente',
    'Gestión de operaciones y supervisión de personal',
    ARRAY[
        'usuarios.ver', 'usuarios.editar',
        'productos.ver', 'categorias.ver',
        'ventas.ver', 'ventas.editar', 'ventas.anular',
        'gastos.ver', 'gastos.crear', 'gastos.editar',
        'reportes.ver', 'reportes.exportar',
        'configuracion.ver',
        'mesas.ver', 'mesas.gestionar', 'mesas.modo_edicion',
        'caja.ver', 'caja.cerrar'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ROL CAJERO
INSERT INTO "Rol" ("id", "nombre", "descripcion", "permisos", "activo", "createdAt", "updatedAt") VALUES (
    'rol_cajero_001',
    'Cajero',
    'Operaciones de caja y ventas',
    ARRAY[
        'ventas.ver', 'ventas.crear',
        'gastos.ver', 'productos.ver', 'mesas.ver',
        'caja.ver', 'caja.abrir'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ROL COCINA
INSERT INTO "Rol" ("id", "nombre", "descripcion", "permisos", "activo", "createdAt", "updatedAt") VALUES (
    'rol_cocina_001',
    'Cocina',
    'Preparación de productos y control de orden',
    ARRAY[
        'productos.ver', 'mesas.ver',
        'cocina.ver', 'cocina.preparar', 'cocina.completar'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ROL VENDEDOR
INSERT INTO "Rol" ("id", "nombre", "descripcion", "permisos", "activo", "createdAt", "updatedAt") VALUES (
    'rol_vendedor_001',
    'Vendedor',
    'Atención al cliente y toma de órdenes',
    ARRAY[
        'productos.ver', 'categorias.ver',
        'ventas.crear', 'ventas.ver',
        'mesas.ver', 'mesas.gestionar'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 5.2 USUARIO DESARROLLADOR (OCULTO)
-- Contraseña: Desarrollo123 (hash bcrypt)
INSERT INTO "Usuario" ("id", "email", "nombre", "password", "activo", "createdAt", "updatedAt") VALUES (
    'usr_desarrollador_001',
    'desarrollador@dev',
    'Alejandro',
    '$2b$10$/ZlndzgoamhI2IoaPXAyLO6ViwXnRhaZuEdkDcEDA3yjXfck1n/L.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 5.3 ASIGNAR ROL DESARROLLADOR AL USUARIO DEV
INSERT INTO "UsuarioRol" ("id", "usuarioId", "rolId", "createdAt") VALUES (
    'ur_dev_001',
    'usr_desarrollador_001',
    'rol_desarrollador_001',
    CURRENT_TIMESTAMP
);

-- 5.4 MESAS PREDETERMINADAS (10 mesas)
INSERT INTO "Mesa" ("id", "numero", "capacidad", "estado", "activo", "createdAt", "updatedAt") VALUES
    ('mesa_001', 1, 2, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_002', 2, 2, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_003', 3, 2, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_004', 4, 2, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_005', 5, 4, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_006', 6, 4, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_007', 7, 4, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_008', 8, 6, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_009', 9, 6, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('mesa_010', 10, 6, 'DISPONIBLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ========================
-- PARTE 6: FUNCIONES
-- ========================

-- Función que carga todos los datos iniciales en un solo viaje de red
-- Usada por el endpoint GET /api/init
CREATE OR REPLACE FUNCTION cargar_datos_iniciales()
RETURNS JSON AS $$
DECLARE
    resultado JSON;
BEGIN
    SELECT json_build_object(
        'mesas', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', m."id",
                    'numero', m."numero",
                    'capacidad', m."capacidad",
                    'estado', m."estado",
                    'activo', m."activo",
                    'posicion', m."posicion",
                    'ubicacion', m."ubicacion",
                    'createdAt', m."createdAt",
                    'updatedAt', m."updatedAt"
                ) ORDER BY m."numero"
            ), '[]'::json)
            FROM "Mesa" m WHERE m."activo" = true
        ),
        'productos', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', p."id",
                    'nombre', p."nombre",
                    'descripcion', p."descripcion",
                    'precio', p."precio",
                    'categoriaId', p."categoriaId",
                    'subcategoria', p."subcategoria",
                    'activo', p."activo",
                    'imagen', p."imagen",
                    'comentarios', p."comentarios",
                    'especial', p."especial",
                    'gruposModificadores', p."gruposModificadores",
                    'configuracionGrupos', p."configuracionGrupos",
                    'createdAt', p."createdAt",
                    'updatedAt', p."updatedAt",
                    'categoria', json_build_object(
                        'id', c."id",
                        'nombre', c."nombre"
                    )
                ) ORDER BY p."nombre"
            ), '[]'::json)
            FROM "Producto" p
            JOIN "Categoria" c ON c."id" = p."categoriaId"
            WHERE p."activo" = true
        ),
        'categorias', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', cat."id",
                    'nombre', cat."nombre",
                    'descripcion', cat."descripcion",
                    'activo', cat."activo",
                    'createdAt', cat."createdAt",
                    'updatedAt', cat."updatedAt",
                    'subcategorias', (
                        SELECT COALESCE(json_agg(
                            json_build_object(
                                'id', s."id",
                                'nombre', s."nombre",
                                'descripcion', s."descripcion",
                                'activo', s."activo",
                                'categoriaId', s."categoriaId"
                            ) ORDER BY s."nombre"
                        ), '[]'::json)
                        FROM "Subcategoria" s
                        WHERE s."categoriaId" = cat."id" AND s."activo" = true
                    )
                ) ORDER BY cat."nombre"
            ), '[]'::json)
            FROM "Categoria" cat WHERE cat."activo" = true
        ),
        'gruposModificadores', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', g."id",
                    'nombre', g."nombre",
                    'descripcion', g."descripcion",
                    'requerido', g."requerido",
                    'cobrar_precio', g."cobrar_precio",
                    'activo', g."activo",
                    'createdAt', g."createdAt",
                    'updatedAt', g."updatedAt",
                    'opciones', (
                        SELECT COALESCE(json_agg(
                            json_build_object(
                                'id', o."id",
                                'nombre', o."nombre",
                                'precioAdicional', o."precioAdicional",
                                'grupoId', o."grupoId",
                                'productoId', o."productoId",
                                'activo', o."activo"
                            ) ORDER BY o."nombre"
                        ), '[]'::json)
                        FROM "OpcionModificador" o
                        WHERE o."grupoId" = g."id" AND o."activo" = true
                    )
                ) ORDER BY g."nombre"
            ), '[]'::json)
            FROM "GrupoModificador" g WHERE g."activo" = true
        )
    ) INTO resultado;

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIN DEL SCRIPT
-- 
-- Resumen de datos insertados:
--   6 Roles (1 oculto "Desarrollador" + 5 visibles)
--   1 Usuario desarrollador (oculto, email: desarrollador@dev)
--   10 Mesas predeterminadas
--
-- CREDENCIALES DEL DESARROLLADOR:
--   Email:    desarrollador@dev
--   Password: Desarrollo123
--   Luego especificar el tenantId del cliente en el campo de tenant
--
-- SIGUIENTE PASO:
--   Crear un usuario Administrador para el cliente, ejemplo:
--   INSERT INTO "Usuario" (...) VALUES (..., 'admin@buenosaires', ...);
-- ============================================================
