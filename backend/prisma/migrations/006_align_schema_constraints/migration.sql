-- Alinear constraints NOT NULL y defaults con producción (Dulce_Momento)

-- Venta
UPDATE "Venta" SET estado = 'completada' WHERE estado IS NULL;
UPDATE "Venta" SET fecha = COALESCE("createdAt", NOW()) WHERE fecha IS NULL;
UPDATE "Venta" SET "createdAt" = COALESCE(fecha, NOW()) WHERE "createdAt" IS NULL;
UPDATE "Venta" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE "Venta" SET "cantidadProductos" = 0 WHERE "cantidadProductos" IS NULL;
ALTER TABLE "Venta" ALTER COLUMN estado SET NOT NULL;
ALTER TABLE "Venta" ALTER COLUMN fecha SET NOT NULL;
ALTER TABLE "Venta" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Venta" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Venta" ALTER COLUMN "cantidadProductos" SET NOT NULL;

-- Orden
UPDATE "Orden" SET estado = 'PENDIENTE' WHERE estado IS NULL;
UPDATE "Orden" SET total = 0 WHERE total IS NULL;
UPDATE "Orden" SET descuento = 0 WHERE descuento IS NULL;
UPDATE "Orden" SET propina = 0 WHERE propina IS NULL;
UPDATE "Orden" SET "visibleCocina" = true WHERE "visibleCocina" IS NULL;
UPDATE "Orden" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "Orden" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
ALTER TABLE "Orden" ALTER COLUMN estado SET NOT NULL;
ALTER TABLE "Orden" ALTER COLUMN total SET NOT NULL;
ALTER TABLE "Orden" ALTER COLUMN descuento SET NOT NULL;
ALTER TABLE "Orden" ALTER COLUMN propina SET NOT NULL;
ALTER TABLE "Orden" ALTER COLUMN "visibleCocina" SET NOT NULL;
ALTER TABLE "Orden" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Orden" ALTER COLUMN "updatedAt" SET NOT NULL;

-- OrdenProducto
UPDATE "OrdenProducto" SET estado = 'PENDIENTE' WHERE estado IS NULL;
UPDATE "OrdenProducto" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "OrdenProducto" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE "OrdenProducto" SET "ordenId" = (SELECT id FROM "Orden" LIMIT 1) WHERE "ordenId" IS NULL AND EXISTS (SELECT 1 FROM "Orden" LIMIT 1);
DELETE FROM "OrdenProducto" WHERE "ordenId" IS NULL;
ALTER TABLE "OrdenProducto" ALTER COLUMN estado SET NOT NULL;
ALTER TABLE "OrdenProducto" ALTER COLUMN "ordenId" SET NOT NULL;
ALTER TABLE "OrdenProducto" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "OrdenProducto" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Caja
UPDATE "Caja" SET activo = true WHERE activo IS NULL;
UPDATE "Caja" SET estado = 'cerrada' WHERE estado IS NULL;
UPDATE "Caja" SET "monto_inicial" = 0 WHERE "monto_inicial" IS NULL;
UPDATE "Caja" SET "total_gastos" = 0 WHERE "total_gastos" IS NULL;
UPDATE "Caja" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "Caja" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE "Caja" SET "fecha_apertura" = COALESCE("createdAt", NOW()) WHERE "fecha_apertura" IS NULL;
ALTER TABLE "Caja" ALTER COLUMN activo SET NOT NULL;
ALTER TABLE "Caja" ALTER COLUMN estado SET NOT NULL;
ALTER TABLE "Caja" ALTER COLUMN "monto_inicial" SET NOT NULL;
ALTER TABLE "Caja" ALTER COLUMN "total_gastos" SET NOT NULL;
ALTER TABLE "Caja" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "Caja" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Caja" ALTER COLUMN "fecha_apertura" SET NOT NULL;
