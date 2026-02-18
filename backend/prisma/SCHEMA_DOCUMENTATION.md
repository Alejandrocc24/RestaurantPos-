# Esquema de Base de Datos - RestaurantPOS Multi-Tenant

## Arquitectura Multi-Tenant

Este sistema utiliza una arquitectura **DATABASE-PER-TENANT**, donde cada cliente tiene su propia base de datos PostgreSQL independiente. Esto proporciona:

✅ **Aislamiento total de datos** - Cada tenant es completamente aislado  
✅ **Seguridad máxima** - Imposible acceso cruzado entre negocios  
✅ **Escalabilidad** - Cada tenant puede crecer independientemente  
✅ **Backups independientes** - Respaldar un tenant no afecta a otros  
✅ **Cumplimiento normativo** - Cumple con GDPR y regulaciones de privacidad  

## Estructura de Tablas

### 1. USUARIOS Y AUTENTICACIÓN

#### `Usuario`
```sql
id (UUID) - Identificador único
email - Email único para login
nombre - Nombre completo
password - Hash bcrypt
activo - Control de activación
createdAt, updatedAt - Auditoría
```

**Índices:**
- `email` - Para búsqueda rápida en login
- `activo` - Para filtrar usuarios activos

---

#### `Rol`
```sql
id (UUID) - Identificador
nombre - Nombre único del rol (admin, gerente, camarero, cocina, etc.)
descripcion - Descripción del rol
activo - Control de activación
```

**Roles predefinidos:**
- `admin` - Acceso total al sistema
- `gerente` - Gestión completa del negocio
- `camarero` - Toma de pedidos
- `cocina` - Vista de órdenes pendientes
- `caja` - Gestión de pagos

---

#### `UsuarioRol`
Tabla de unión para relación muchos-a-muchos entre Usuarios y Roles.

```sql
usuarioId (FK) - Referencia al Usuario
rolId (FK) - Referencia al Rol
```

**Diseño:**
- Un usuario puede tener múltiples roles
- Un rol puede tener múltiples usuarios
- Relación única por usuario-rol

---

#### `Permiso`
```sql
id (UUID)
nombre - Nombre único del permiso
descripcion - Descripción detallada
```

**Permisos comunes:**
- `crear_producto`, `editar_producto`, `eliminar_producto`
- `ver_ordenes`, `crear_orden`, `completar_orden`
- `ver_gastos`, `crear_gasto`, `eliminar_gasto`
- `gestionar_usuarios`, `gestionar_roles`

---

### 2. CATÁLOGOS DE PRODUCTOS

#### `Categoria`
```sql
id (UUID)
nombre - Nombre único (Bebidas, Platos Principales, Postres, etc.)
descripcion
activo - Control de visibilidad
```

**Índices:**
- `activo` - Filtrar categorías disponibles

---

#### `Producto`
```sql
id (UUID)
nombre - Nombre del producto
descripcion - Descripción larga
precio - Precio de venta
categoriaId (FK) - Relación a Categoria
activo - Control de disponibilidad
imagen - URL o ruta de imagen
```

**Índices:**
- `categoriaId` - INNER JOIN rápido
- `activo` - Productos disponibles
- `nombre` - Búsqueda de productos

**Relaciones:**
- Un Producto pertenece a una Categoria
- Un Producto puede tener muchos GrupoModificador

---

#### `GrupoModificador` (Adicionales/Personalizaciones)
Ejemplo: "Opciones de Bebida" (frío, caliente, hielo, etc.)

```sql
id (UUID)
nombre - "Tamaño", "Opciones de Bebida", "Nivel de Picante"
descripcion
requerido - Boolean (¿Cliente debe seleccionar?)
activo
```

---

#### `OpcionModificador`
```sql
id (UUID)
nombre - "Grande", "Pequeño", "Con Hielo"
precioAdicional - Puede agregar costo extra
grupoId (FK) - Referencia a GrupoModificador
```

**Ejemplo de relaciones:**
```
Producto: "Café"
  - GrupoModificador: "Tamaño" (requerido: true)
    - OpcionModificador: "Pequeño" (+$0)
    - OpcionModificador: "Mediano" (+$1)
    - OpcionModificador: "Grande" (+$2)
```

---

### 3. GESTIÓN DE MESAS

#### `Mesa`
```sql
id (UUID)
numero - Número único de mesa (1-50, etc.)
capacidad - Número de personas
estado - ENUM: DISPONIBLE, OCUPADA, RESERVADA, FUERA_DE_SERVICIO
activo - Control de existencia
```

**Índices:**
- `estado` - Consultas por disponibilidad
- `activo` - Filtrar mesas activas

---

### 4. ÓRDENES Y VENTAS

#### `Orden` (Pedidos/Transacciones)
```sql
id (UUID)
mesaId (FK) - Nullable (pueden ser para llevar)
usuarioId (FK) - Quién registró la orden
estado - ENUM: PENDIENTE, EN_CURSO, COMPLETADA, CANCELADA, PAGADA
total - Suma de subtotales + propina - descuento
descuento - Descuento aplicado
propina - Propina agregada
createdAt - Hora del pedido
compledatAt - Hora de completación (nullable)
```

**Estados de orden:**
```
PENDIENTE → EN_CURSO → COMPLETADA → PAGADA → Archivada
                    ↓
                 CANCELADA
```

**Índices:**
- `mesaId` - Órdenes por mesa
- `usuarioId` - Órdenes por camarero
- `estado` - Órdenes pendientes/activas
- `createdAt` - Reportes por fecha

---

#### `OrdenProducto` (Detalles de orden)
```sql
id (UUID)
ordenId (FK) - Referencia a Orden
productoId (FK) - Referencia a Producto
cantidad - Número de unidades
precioUnitario - Precio en ese momento (histórico)
subtotal - cantidad * precioUnitario
estado - "pendiente", "preparando", "listo", "entregado"
notas - Instrucciones especiales ("sin sal", "sin cebolla")
```

**Diseño:**
- Guardamos el precio histórico (clave para historial de precios)
- Cada producto puede tener múltiples modificadores
- El estado permite seguimiento en cocina

---

#### `Pago`
```sql
id (UUID)
ordenId (FK) - Referencia a Orden
monto - Puede ser pago parcial
metodoPago - ENUM: EFECTIVO, TARJETA, TRANSFERENCIA, CHEQUE, OTRO
referencia - Número de transacción, voucher, etc.
estado - ENUM: PENDIENTE, COMPLETADO, CANCELADO, REEMBOLSADO
```

**Diseño:**
- Permite múltiples pagos por orden (deuda + pago posterior)
- Registro de método de pago para análisis

---

### 5. GESTIÓN DE GASTOS

#### `CategoriaGasto`
```sql
id (UUID)
nombre - "Suministros", "Servicios", "Personal", "Mantenimiento"
descripcion
activo
```

---

#### `Gasto`
```sql
id (UUID)
descripcion - "Servilletas 500 unidades"
monto - Cantidad gastada
categoriaId (FK) - Categoría del gasto
usuarioId (FK) - Quién registró el gasto
fecha - Fecha del gasto (puede ser retroactivo)
recibo - URL/referencia del comprobante
observaciones - Notas adicionales
activo - Permite "anular" sin eliminar
```

**Índices:**
- `categoriaId`, `usuarioId`, `fecha` - Reportes
- `activo` - Filtrar gastos válidos

---

### 6. PROVEEDORES Y COMPRAS

#### `Proveedor`
```sql
id (UUID)
nombre - Nombre único del proveedor
contacto - Nombre del contacto
correo, telefono
direccion, ciudad
activo
```

---

#### `Compra`
```sql
id (UUID)
proveedorId (FK) - De quién se compró
numeroDocumento - Factura/Recibo
monto - Total de compra
estado - ENUM: PENDIENTE, COMPLETADA, CANCELADA
observaciones - Notas sobre la compra
```

---

### 7. CONFIGURACIÓN

#### `Configuracion`
```sql
clave - Identificador único (IVA, NOMBRE_NEGOCIO, etc.)
valor - Valor guardado
tipo - "string", "number", "boolean", "json"
descripcion - Documentación
```

**Ejemplos:**
```
{"NOMBRE_NEGOCIO": "Mi Restaurante"}
{"IVA": "19"}
{"NÚMERO_FACTURA_ACTUAL": "1001"}
{"HORARIO_CIERRE": "22:00"}
```

---

## Relaciones Principales

```
Usuario
  ├─ UsuarioRol (1:N)
  │   └─ Rol (N:M)
  ├─ Orden (1:N) - Quién creó la orden
  ├─ Gasto (1:N) - Quién registró el gasto

Producto
  ├─ Categoria (N:1)
  ├─ GrupoModificador (N:M)
  └─ OrdenProducto (1:N)

Orden
  ├─ Mesa (N:1) - Nullable
  ├─ Usuario (N:1)
  ├─ OrdenProducto (1:N)
  └─ Pago (1:N) - Múltiples pagos posibles

CategoriaGasto
  └─ Gasto (1:N)

Proveedor
  └─ Compra (1:N)
```

---

## Query de Ejemplo: Orden Completa

```sql
SELECT 
  o.id, o.numero, o.estado, o.total,
  m.numero as mesa_numero,
  u.nombre as usuario_nombre,
  op.id as item_id,
  p.nombre as producto_nombre,
  op.cantidad,
  op.precioUnitario
FROM orden o
LEFT JOIN mesa m ON o.mesaId = m.id
LEFT JOIN usuario u ON o.usuarioId = u.id
LEFT JOIN orden_producto op ON o.id = op.ordenId
LEFT JOIN producto p ON op.productoId = p.id
WHERE o.id = 'xyz123'
ORDER BY op.createdAt;
```

---

## Seguridad y Auditoría

1. **Timestamps en todas las tablas** - `createdAt` y `updatedAt`
2. **Hash de contraseñas** - Almacenadas con bcrypt (nunca en texto plano)
3. **Isolación de datos** - DATABASE_URL diferente por tenant
4. **Índices estratégicos** - Optimizados para queries más comunes
5. **Foreign Keys con restricciones** - Integridad referencial

---

## Consideraciones de Escalabilidad

### Crecimiento
- **Usuarios**: Aplicación común en cualquier tamaño
- **Órdenes**: Crece rápidamente (1000s/mes típicos)
- **Productos**: Catálogo (100s-1000s)

### Optimizaciones futuras
- Particionamiento de tabla `Orden` por fecha
- Archivado de órdenes antiguas a tabla histórica
- Caché de productos frecuentes
- Denormalización de totales en `Orden` (ya aplicada)

---

## Script de Inicialización

Ver `prisma/seed.ts` para datos iniciales y roles predefinidos.
