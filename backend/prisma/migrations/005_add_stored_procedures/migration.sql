-- Helper: genera IDs compatibles con cuid()
CREATE OR REPLACE FUNCTION public.generate_cuid()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  ts text;
  rand text;
BEGIN
  ts := lpad(to_hex(extract(epoch from now())::bigint * 1000), 8, '0');
  rand := encode(gen_random_bytes(12), 'hex');
  RETURN 'cmm' || ts || substr(rand, 1, 17);
END;
$function$;

-- Crear o actualizar orden de mesa con items
CREATE OR REPLACE FUNCTION public.crear_orden_mesa(p_mesa_id text, p_usuario_id text, p_notas text DEFAULT NULL::text, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_orden_id text;
  v_orden_estado text;
  v_total_actual float8 := 0;
  v_total_nuevos float8 := 0;
  v_item jsonb;
  v_item_id text;
  v_result jsonb;
BEGIN
  SELECT id, estado, total INTO v_orden_id, v_orden_estado, v_total_actual
  FROM "Orden"
  WHERE "mesaId" = p_mesa_id
    AND estado IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADA')
  ORDER BY "createdAt" DESC
  LIMIT 1;

  IF v_orden_id IS NULL THEN
    v_orden_id := generate_cuid();
    v_orden_estado := 'PENDIENTE';
    v_total_actual := 0;

    INSERT INTO "Orden" (id, "mesaId", "usuarioId", estado, total, notas, "visibleCocina", "createdAt", "updatedAt")
    VALUES (v_orden_id, p_mesa_id, p_usuario_id, 'PENDIENTE'::"EstadoOrden", 0, p_notas, true, NOW(), NOW());
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := generate_cuid();
    INSERT INTO "OrdenProducto" (id, "ordenId", "productoId", cantidad, "precioUnitario", subtotal, notas, comentario, modificadores, "createdAt", "updatedAt")
    VALUES (
      v_item_id,
      v_orden_id,
      v_item->>'productoId',
      COALESCE((v_item->>'cantidad')::int, 1),
      COALESCE((v_item->>'precioUnitario')::float8, 0),
      COALESCE((v_item->>'cantidad')::int, 1) * COALESCE((v_item->>'precioUnitario')::float8, 0),
      v_item->>'notas',
      v_item->>'comentario',
      v_item->'modificadores',
      NOW(),
      NOW()
    );
    v_total_nuevos := v_total_nuevos + (COALESCE((v_item->>'cantidad')::int, 1) * COALESCE((v_item->>'precioUnitario')::float8, 0));
  END LOOP;

  UPDATE "Orden"
  SET total = v_total_actual + v_total_nuevos,
      estado = CASE WHEN v_orden_estado = 'COMPLETADA' THEN 'PENDIENTE'::"EstadoOrden" ELSE estado END,
      "visibleCocina" = true,
      notas = COALESCE(p_notas, notas),
      "updatedAt" = NOW()
  WHERE id = v_orden_id;

  UPDATE "Mesa" SET estado = 'OCUPADA'::"EstadoMesa", "updatedAt" = NOW() WHERE id = p_mesa_id;

  SELECT jsonb_build_object(
    'id', o.id,
    'mesaId', o."mesaId",
    'usuarioId', o."usuarioId",
    'estado', o.estado::text,
    'total', o.total,
    'descuento', o.descuento,
    'propina', o.propina,
    'notas', o.notas,
    'visibleCocina', o."visibleCocina",
    'createdAt', o."createdAt",
    'updatedAt', o."updatedAt",
    'mesa', jsonb_build_object('id', m.id, 'numero', m.numero, 'capacidad', m.capacidad, 'estado', m.estado::text, 'activo', m.activo),
    'usuario', jsonb_build_object('id', u.id, 'nombre', u.nombre, 'email', u.email),
    'productos', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id,
          'ordenId', op."ordenId",
          'productoId', op."productoId",
          'cantidad', op.cantidad,
          'precioUnitario', op."precioUnitario",
          'subtotal', op.subtotal,
          'estado', op.estado,
          'notas', op.notas,
          'comentario', op.comentario,
          'modificadores', CASE WHEN op.modificadores IS NOT NULL THEN op.modificadores::jsonb ELSE '[]'::jsonb END,
          'createdAt', op."createdAt",
          'updatedAt', op."updatedAt",
          'producto', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio, 'descripcion', p.descripcion, 'categoriaId', p."categoriaId", 'activo', p.activo, 'imagen', p.imagen, 'especial', p.especial, 'comentarios', p.comentarios, 'configuracionGrupos', p."configuracionGrupos")
        )
      )
      FROM "OrdenProducto" op
      LEFT JOIN "Producto" p ON p.id = op."productoId"
      WHERE op."ordenId" = o.id
    ), '[]'::jsonb),
    'pagos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', pg.id, 'ordenId', pg."ordenId", 'monto', pg.monto, 'metodoPago', pg."metodoPago"::text, 'estado', pg.estado::text))
      FROM "Pago" pg WHERE pg."ordenId" = o.id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM "Orden" o
  LEFT JOIN "Mesa" m ON m.id = o."mesaId"
  LEFT JOIN "Usuario" u ON u.id = o."usuarioId"
  WHERE o.id = v_orden_id;

  RETURN v_result;
END;
$function$;

-- Obtener orden activa de una mesa
CREATE OR REPLACE FUNCTION public.obtener_orden_activa_mesa(p_mesa_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_orden_id text;
  v_result jsonb;
BEGIN
  SELECT id INTO v_orden_id
  FROM "Orden"
  WHERE "mesaId" = p_mesa_id
    AND estado IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADA')
  ORDER BY "createdAt" DESC
  LIMIT 1;

  IF v_orden_id IS NULL THEN
    RETURN null;
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'mesaId', o."mesaId",
    'usuarioId', o."usuarioId",
    'estado', o.estado::text,
    'total', o.total,
    'descuento', o.descuento,
    'propina', o.propina,
    'notas', o.notas,
    'visibleCocina', o."visibleCocina",
    'createdAt', o."createdAt",
    'updatedAt', o."updatedAt",
    'mesa', jsonb_build_object('id', m.id, 'numero', m.numero, 'capacidad', m.capacidad, 'estado', m.estado::text, 'activo', m.activo),
    'usuario', jsonb_build_object('id', u.id, 'nombre', u.nombre, 'email', u.email),
    'productos', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id, 'ordenId', op."ordenId", 'productoId', op."productoId",
          'cantidad', op.cantidad, 'precioUnitario', op."precioUnitario", 'subtotal', op.subtotal,
          'estado', op.estado, 'notas', op.notas, 'comentario', op.comentario,
          'modificadores', CASE WHEN op.modificadores IS NOT NULL THEN op.modificadores::jsonb ELSE '[]'::jsonb END,
          'createdAt', op."createdAt", 'updatedAt', op."updatedAt",
          'producto', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio, 'descripcion', p.descripcion, 'categoriaId', p."categoriaId", 'activo', p.activo, 'imagen', p.imagen, 'especial', p.especial, 'comentarios', p.comentarios, 'configuracionGrupos', p."configuracionGrupos")
        )
      )
      FROM "OrdenProducto" op
      LEFT JOIN "Producto" p ON p.id = op."productoId"
      WHERE op."ordenId" = o.id
    ), '[]'::jsonb),
    'pagos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', pg.id, 'ordenId', pg."ordenId", 'monto', pg.monto, 'metodoPago', pg."metodoPago"::text, 'estado', pg.estado::text))
      FROM "Pago" pg WHERE pg."ordenId" = o.id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM "Orden" o
  LEFT JOIN "Mesa" m ON m.id = o."mesaId"
  LEFT JOIN "Usuario" u ON u.id = o."usuarioId"
  WHERE o.id = v_orden_id;

  RETURN v_result;
END;
$function$;

-- Cobrar orden completa y liberar mesa
CREATE OR REPLACE FUNCTION public.cobrar_orden_total(p_orden_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_mesa_id text;
  v_mesa_numero int;
  v_notas_actuales text;
  v_result jsonb;
BEGIN
  SELECT o."mesaId", m.numero, o.notas
  INTO v_mesa_id, v_mesa_numero, v_notas_actuales
  FROM "Orden" o
  LEFT JOIN "Mesa" m ON m.id = o."mesaId"
  WHERE o.id = p_orden_id;

  IF v_mesa_id IS NOT NULL THEN
    UPDATE "Orden"
    SET "mesaId" = NULL,
        notas = TRIM('[Mesa ' || v_mesa_numero || '] ' || COALESCE(v_notas_actuales, '')),
        "updatedAt" = NOW()
    WHERE id = p_orden_id;

    UPDATE "Mesa"
    SET estado = 'DISPONIBLE'::"EstadoMesa", "updatedAt" = NOW()
    WHERE id = v_mesa_id;
  ELSE
    UPDATE "Orden"
    SET "updatedAt" = NOW()
    WHERE id = p_orden_id;
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'mesaId', o."mesaId",
    'usuarioId', o."usuarioId",
    'estado', o.estado::text,
    'total', o.total,
    'notas', o.notas,
    'visibleCocina', o."visibleCocina",
    'createdAt', o."createdAt",
    'updatedAt', o."updatedAt",
    'mesa', null,
    'usuario', jsonb_build_object('id', u.id, 'nombre', u.nombre, 'email', u.email),
    'productos', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id,
          'ordenId', op."ordenId",
          'productoId', op."productoId",
          'cantidad', op.cantidad,
          'precioUnitario', op."precioUnitario",
          'subtotal', op.subtotal,
          'estado', op.estado,
          'notas', op.notas,
          'comentario', op.comentario,
          'modificadores', CASE WHEN op.modificadores IS NOT NULL THEN op.modificadores::jsonb ELSE '[]'::jsonb END,
          'producto', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio, 'descripcion', p.descripcion, 'categoriaId', p."categoriaId", 'activo', p.activo, 'imagen', p.imagen)
        )
      )
      FROM "OrdenProducto" op
      LEFT JOIN "Producto" p ON p.id = op."productoId"
      WHERE op."ordenId" = o.id
    ), '[]'::jsonb),
    'pagos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', pg.id, 'monto', pg.monto, 'metodoPago', pg."metodoPago"::text, 'estado', pg.estado::text))
      FROM "Pago" pg WHERE pg."ordenId" = o.id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM "Orden" o
  LEFT JOIN "Usuario" u ON u.id = o."usuarioId"
  WHERE o.id = p_orden_id;

  RETURN v_result;
END;
$function$;

-- Actualizar cantidades de productos en una orden
CREATE OR REPLACE FUNCTION public.actualizar_cantidades_orden(p_orden_id text, p_productos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_item jsonb;
  v_total float8 := 0;
  v_restantes int := 0;
  v_pedido_cerrado boolean := false;
  v_mesa_id text;
  v_result jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_productos)
  LOOP
    IF (v_item->>'detalleId') IS NOT NULL AND (v_item->>'detalleId') != '' THEN
      UPDATE "OrdenProducto"
      SET cantidad = COALESCE((v_item->>'cantidad')::int, 0),
          subtotal = COALESCE((v_item->>'cantidad')::int, 0) * COALESCE((v_item->>'precioUnitario')::float8, 0),
          "updatedAt" = NOW()
      WHERE "ordenId" = p_orden_id
        AND id = (v_item->>'detalleId');
    ELSE
      UPDATE "OrdenProducto"
      SET cantidad = COALESCE((v_item->>'cantidad')::int, 0),
          subtotal = COALESCE((v_item->>'cantidad')::int, 0) * COALESCE((v_item->>'precioUnitario')::float8, 0),
          "updatedAt" = NOW()
      WHERE "ordenId" = p_orden_id
        AND "productoId" = (v_item->>'productoId');
    END IF;
  END LOOP;

  DELETE FROM "OrdenProducto" WHERE "ordenId" = p_orden_id AND cantidad = 0;

  SELECT COALESCE(SUM(subtotal), 0), COUNT(*)
  INTO v_total, v_restantes
  FROM "OrdenProducto"
  WHERE "ordenId" = p_orden_id;

  v_pedido_cerrado := (v_restantes = 0);

  SELECT "mesaId" INTO v_mesa_id FROM "Orden" WHERE id = p_orden_id;

  UPDATE "Orden"
  SET total = v_total,
      estado = CASE WHEN v_pedido_cerrado THEN 'COMPLETADA'::"EstadoOrden" ELSE estado END,
      "visibleCocina" = CASE WHEN v_pedido_cerrado THEN false ELSE "visibleCocina" END,
      "mesaId" = CASE WHEN v_pedido_cerrado THEN NULL ELSE "mesaId" END,
      "updatedAt" = NOW()
  WHERE id = p_orden_id;

  IF v_pedido_cerrado AND v_mesa_id IS NOT NULL THEN
    UPDATE "Mesa" SET estado = 'DISPONIBLE'::"EstadoMesa", "updatedAt" = NOW() WHERE id = v_mesa_id;
  END IF;

  SELECT jsonb_build_object(
    'id', o.id,
    'mesaId', o."mesaId",
    'usuarioId', o."usuarioId",
    'estado', o.estado::text,
    'total', o.total,
    'notas', o.notas,
    'visibleCocina', o."visibleCocina",
    'createdAt', o."createdAt",
    'updatedAt', o."updatedAt",
    'mesa', CASE WHEN o."mesaId" IS NOT NULL THEN (
      SELECT jsonb_build_object('id', m.id, 'numero', m.numero, 'capacidad', m.capacidad, 'estado', m.estado::text)
      FROM "Mesa" m WHERE m.id = o."mesaId"
    ) ELSE null END,
    'usuario', jsonb_build_object('id', u.id, 'nombre', u.nombre, 'email', u.email),
    'productos', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', op.id, 'ordenId', op."ordenId", 'productoId', op."productoId",
          'cantidad', op.cantidad, 'precioUnitario', op."precioUnitario", 'subtotal', op.subtotal,
          'estado', op.estado, 'notas', op.notas, 'comentario', op.comentario,
          'modificadores', CASE WHEN op.modificadores IS NOT NULL THEN op.modificadores::jsonb ELSE '[]'::jsonb END,
          'producto', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio, 'descripcion', p.descripcion, 'categoriaId', p."categoriaId", 'activo', p.activo, 'imagen', p.imagen)
        )
      )
      FROM "OrdenProducto" op
      LEFT JOIN "Producto" p ON p.id = op."productoId"
      WHERE op."ordenId" = o.id
    ), '[]'::jsonb),
    'pagos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', pg.id, 'monto', pg.monto, 'metodoPago', pg."metodoPago"::text))
      FROM "Pago" pg WHERE pg."ordenId" = o.id
    ), '[]'::jsonb),
    'pedidoCerrado', v_pedido_cerrado,
    'productosRestantes', v_restantes
  ) INTO v_result
  FROM "Orden" o
  LEFT JOIN "Usuario" u ON u.id = o."usuarioId"
  WHERE o.id = p_orden_id;

  RETURN v_result;
END;
$function$;

-- Transferir productos entre mesas
CREATE OR REPLACE FUNCTION public.transferir_productos_mesa(p_mesa_origen_id text, p_mesa_destino_id text, p_usuario_id text, p_detalle_ids jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_orden_origen_id text;
  v_orden_destino_id text;
  v_orden_destino_estado text;
  v_total_origen float8 := 0;
  v_total_destino float8 := 0;
  v_restantes_origen int := 0;
  v_result_origen jsonb;
  v_result_destino jsonb;
BEGIN
  SELECT id INTO v_orden_origen_id
  FROM "Orden"
  WHERE "mesaId" = p_mesa_origen_id
    AND estado IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADA')
  ORDER BY "createdAt" DESC
  LIMIT 1;

  IF v_orden_origen_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró orden activa en la mesa origen';
  END IF;

  SELECT id, estado::text INTO v_orden_destino_id, v_orden_destino_estado
  FROM "Orden"
  WHERE "mesaId" = p_mesa_destino_id
    AND estado IN ('PENDIENTE', 'EN_CURSO', 'COMPLETADA')
  ORDER BY "createdAt" DESC
  LIMIT 1;

  IF v_orden_destino_id IS NULL THEN
    v_orden_destino_id := generate_cuid();
    v_orden_destino_estado := 'PENDIENTE';
    INSERT INTO "Orden" (id, "mesaId", "usuarioId", estado, total, "visibleCocina", "createdAt", "updatedAt")
    VALUES (v_orden_destino_id, p_mesa_destino_id, p_usuario_id, 'PENDIENTE'::"EstadoOrden", 0, true, NOW(), NOW());
  END IF;

  UPDATE "OrdenProducto"
  SET "ordenId" = v_orden_destino_id, "updatedAt" = NOW()
  WHERE id IN (SELECT jsonb_array_elements_text(p_detalle_ids))
    AND "ordenId" = v_orden_origen_id;

  SELECT COALESCE(SUM(subtotal), 0), COUNT(*)
  INTO v_total_origen, v_restantes_origen
  FROM "OrdenProducto"
  WHERE "ordenId" = v_orden_origen_id;

  IF v_restantes_origen = 0 THEN
    UPDATE "Orden" SET "mesaId" = NULL, total = 0, estado = 'COMPLETADA'::"EstadoOrden", "visibleCocina" = false, "updatedAt" = NOW()
    WHERE id = v_orden_origen_id;

    UPDATE "Mesa" SET estado = 'DISPONIBLE'::"EstadoMesa", "updatedAt" = NOW()
    WHERE id = p_mesa_origen_id;

    v_result_origen := jsonb_build_object('pedido', null);
  ELSE
    UPDATE "Orden" SET total = v_total_origen, "updatedAt" = NOW()
    WHERE id = v_orden_origen_id;

    SELECT jsonb_build_object('pedido', jsonb_build_object(
      'id', v_orden_origen_id,
      'total', v_total_origen,
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', op.id, 'ordenId', op."ordenId", 'productoId', op."productoId",
          'cantidad', op.cantidad, 'precioUnitario', op."precioUnitario", 'subtotal', op.subtotal,
          'estado', op.estado, 'notas', op.notas, 'comentario', op.comentario,
          'modificadores', CASE WHEN op.modificadores IS NOT NULL THEN op.modificadores::jsonb ELSE '[]'::jsonb END,
          'producto', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio)
        ))
        FROM "OrdenProducto" op LEFT JOIN "Producto" p ON p.id = op."productoId"
        WHERE op."ordenId" = v_orden_origen_id
      ), '[]'::jsonb)
    )) INTO v_result_origen;
  END IF;

  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_total_destino
  FROM "OrdenProducto"
  WHERE "ordenId" = v_orden_destino_id;

  UPDATE "Orden"
  SET total = v_total_destino,
      "visibleCocina" = true,
      estado = CASE WHEN estado = 'COMPLETADA' THEN 'PENDIENTE'::"EstadoOrden" ELSE estado END,
      "updatedAt" = NOW()
  WHERE id = v_orden_destino_id;

  UPDATE "Mesa" SET estado = 'OCUPADA'::"EstadoMesa", "updatedAt" = NOW()
  WHERE id = p_mesa_destino_id;

  SELECT jsonb_build_object('pedido', jsonb_build_object(
    'id', v_orden_destino_id,
    'total', v_total_destino,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', op.id, 'ordenId', op."ordenId", 'productoId', op."productoId",
        'cantidad', op.cantidad, 'precioUnitario', op."precioUnitario", 'subtotal', op.subtotal,
        'estado', op.estado, 'notas', op.notas, 'comentario', op.comentario,
        'modificadores', CASE WHEN op.modificadores IS NOT NULL THEN op.modificadores::jsonb ELSE '[]'::jsonb END,
        'producto', jsonb_build_object('id', p.id, 'nombre', p.nombre, 'precio', p.precio)
      ))
      FROM "OrdenProducto" op LEFT JOIN "Producto" p ON p.id = op."productoId"
      WHERE op."ordenId" = v_orden_destino_id
    ), '[]'::jsonb)
  )) INTO v_result_destino;

  RETURN jsonb_build_object('origen', v_result_origen, 'destino', v_result_destino);
END;
$function$;

-- Crear registro de venta
CREATE OR REPLACE FUNCTION public.crear_venta(p_mesa_id text, p_usuario_id text, p_orden_id text, p_total double precision, p_estado text, p_metodo_pago text, p_fecha timestamp without time zone, p_cantidad_productos integer, p_productos_json text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_id text;
  v_result jsonb;
BEGIN
  v_id := generate_cuid();

  INSERT INTO "Venta" (id, "mesaId", "usuarioId", "ordenId", total, estado, "metodoPago", fecha, "cantidadProductos", "productosJson", "createdAt", "updatedAt")
  VALUES (v_id, p_mesa_id, p_usuario_id, p_orden_id, p_total, p_estado, p_metodo_pago, p_fecha, p_cantidad_productos, p_productos_json, NOW(), NOW());

  SELECT jsonb_build_object(
    'id', v.id,
    'mesaId', v."mesaId",
    'usuarioId', v."usuarioId",
    'ordenId', v."ordenId",
    'total', v.total,
    'estado', v.estado,
    'metodoPago', v."metodoPago",
    'fecha', v.fecha,
    'cantidadProductos', v."cantidadProductos",
    'productosJson', v."productosJson",
    'createdAt', v."createdAt"
  ) INTO v_result
  FROM "Venta" v WHERE v.id = v_id;

  RETURN v_result;
END;
$function$;
