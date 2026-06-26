-- Stored procedure usada por GET /api/init
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
