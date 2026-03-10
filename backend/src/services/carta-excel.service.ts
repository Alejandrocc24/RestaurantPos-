import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

export class CartaExcelService {

    /**
     * Exportar la carta completa a un buffer de Excel
     */
    static async exportarCarta(prisma: PrismaClient): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'RestaurantPOS';
        workbook.created = new Date();

        // ==========================================
        // Hoja 0: Instrucciones
        // ==========================================
        CartaExcelService.crearHojaInstrucciones(workbook);

        // ==========================================
        // Hoja 1: Categorías
        // ==========================================
        const categoriasSheet = workbook.addWorksheet('Categorías');
        const categorias = await prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });

        categoriasSheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'Activo', key: 'activo', width: 10 },
        ];

        // Estilo de encabezado
        CartaExcelService.estiloEncabezado(categoriasSheet, '4472C4');

        categorias.forEach(c => {
            categoriasSheet.addRow({
                nombre: c.nombre,
                descripcion: c.descripcion || '',
                activo: c.activo ? 'Sí' : 'No',
            });
        });

        // ==========================================
        // Hoja 2: Subcategorías
        // ==========================================
        const subcategoriasSheet = workbook.addWorksheet('Subcategorías');
        const subcategorias = await prisma.subcategoria.findMany({
            include: { categoria: true },
            orderBy: { nombre: 'asc' },
        });

        subcategoriasSheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Categoría', key: 'categoria', width: 30 },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'Activo', key: 'activo', width: 10 },
        ];

        CartaExcelService.estiloEncabezado(subcategoriasSheet, '548235');

        subcategorias.forEach(s => {
            subcategoriasSheet.addRow({
                nombre: s.nombre,
                categoria: (s as any).categoria?.nombre || '',
                descripcion: s.descripcion || '',
                activo: s.activo ? 'Sí' : 'No',
            });
        });

        // ==========================================
        // Hoja 3: Productos (la principal)
        // ==========================================
        const productosSheet = workbook.addWorksheet('Productos');
        const productos = await prisma.producto.findMany({
            include: { categoria: true },
            orderBy: [{ categoria: { nombre: 'asc' } }, { nombre: 'asc' }],
        });

        productosSheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 35 },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'Precio', key: 'precio', width: 15 },
            { header: 'Categoría', key: 'categoria', width: 25 },
            { header: 'Subcategoría', key: 'subcategoria', width: 25 },
            { header: 'Activo', key: 'activo', width: 10 },
            { header: 'Especial', key: 'especial', width: 10 },
        ];

        CartaExcelService.estiloEncabezado(productosSheet, 'C00000');

        productos.forEach(p => {
            const row = productosSheet.addRow({
                nombre: p.nombre,
                descripcion: p.descripcion || '',
                precio: p.precio,
                categoria: (p as any).categoria?.nombre || '',
                subcategoria: p.subcategoria || '',
                activo: p.activo ? 'Sí' : 'No',
                especial: p.especial ? 'Sí' : 'No',
            });

            // Formato de moneda para precio
            row.getCell('precio').numFmt = '$#,##0.00';
        });

        // ==========================================
        // Hoja 4: Grupos de Modificadores
        // ==========================================
        const gruposSheet = workbook.addWorksheet('Grupos Modificadores');
        const grupos = await prisma.grupoModificador.findMany({
            orderBy: { nombre: 'asc' },
        });

        gruposSheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Descripción', key: 'descripcion', width: 40 },
            { header: 'Requerido', key: 'requerido', width: 12 },
            { header: 'Cobrar Precio', key: 'cobrar_precio', width: 15 },
            { header: 'Activo', key: 'activo', width: 10 },
        ];

        CartaExcelService.estiloEncabezado(gruposSheet, '7030A0');

        grupos.forEach(g => {
            gruposSheet.addRow({
                nombre: g.nombre,
                descripcion: g.descripcion || '',
                requerido: g.requerido ? 'Sí' : 'No',
                cobrar_precio: g.cobrar_precio ? 'Sí' : 'No',
                activo: g.activo ? 'Sí' : 'No',
            });
        });

        // ==========================================
        // Hoja 5: Opciones de Modificador
        // ==========================================
        const opcionesSheet = workbook.addWorksheet('Opciones Modificador');
        const opciones = await prisma.opcionModificador.findMany({
            include: { grupo: true },
            orderBy: [{ grupo: { nombre: 'asc' } }, { nombre: 'asc' }],
        });

        opcionesSheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Grupo', key: 'grupo', width: 30 },
            { header: 'Precio Adicional', key: 'precioAdicional', width: 18 },
            { header: 'Activo', key: 'activo', width: 10 },
        ];

        CartaExcelService.estiloEncabezado(opcionesSheet, 'ED7D31');

        opciones.forEach(o => {
            const row = opcionesSheet.addRow({
                nombre: o.nombre,
                grupo: (o as any).grupo?.nombre || '',
                precioAdicional: o.precioAdicional,
                activo: o.activo ? 'Sí' : 'No',
            });

            row.getCell('precioAdicional').numFmt = '$#,##0.00';
        });

        // ==========================================
        // Hoja 6: Comentarios Preestablecidos
        // ==========================================
        const comentariosSheet = workbook.addWorksheet('Comentarios Preestablecidos');
        const comentarios = await prisma.comentarioPreestablecido.findMany({
            orderBy: { texto: 'asc' },
        });

        comentariosSheet.columns = [
            { header: 'Texto', key: 'texto', width: 50 },
            { header: 'Activo', key: 'activo', width: 10 },
        ];

        CartaExcelService.estiloEncabezado(comentariosSheet, '00B050');

        comentarios.forEach(c => {
            comentariosSheet.addRow({
                texto: c.texto,
                activo: c.activo ? 'Sí' : 'No',
            });
        });

        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Importar la carta desde un archivo Excel
     */
    static async importarCarta(prisma: PrismaClient, fileBuffer: Buffer): Promise<{
        categoriasCreadas: number;
        categoriasActualizadas: number;
        subcategoriasCreadas: number;
        productosCreados: number;
        productosActualizados: number;
        gruposCreados: number;
        opcionesCreadas: number;
        comentariosCreados: number;
        errores: string[];
    }> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer as any);

        const resultado = {
            categoriasCreadas: 0,
            categoriasActualizadas: 0,
            subcategoriasCreadas: 0,
            productosCreados: 0,
            productosActualizados: 0,
            gruposCreados: 0,
            opcionesCreadas: 0,
            comentariosCreados: 0,
            errores: [] as string[],
        };

        // Mapa de categorías para resolver referencias
        const categoriasMap = new Map<string, string>(); // nombre -> id

        // ==========================================
        // 1. Procesar Categorías
        // ==========================================
        const categoriasSheet = workbook.getWorksheet('Categorías') || workbook.getWorksheet('Categorias');
        if (categoriasSheet) {
            const categoriasData: Array<{ nombre: string; descripcion: string; activo: boolean }> = [];
            categoriasSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const nombre = String(row.getCell(1).value || '').trim();
                if (!nombre) return;

                categoriasData.push({
                    nombre,
                    descripcion: String(row.getCell(2).value || '').trim(),
                    activo: CartaExcelService.parsearBooleano(row.getCell(3).value),
                });
            });

            for (const cat of categoriasData) {
                try {
                    const existente = await prisma.categoria.findFirst({
                        where: { nombre: { equals: cat.nombre, mode: 'insensitive' } }
                    });

                    if (existente) {
                        await prisma.categoria.update({
                            where: { id: existente.id },
                            data: { descripcion: cat.descripcion, activo: cat.activo }
                        });
                        categoriasMap.set(cat.nombre.toLowerCase(), existente.id);
                        resultado.categoriasActualizadas++;
                    } else {
                        const nueva = await prisma.categoria.create({
                            data: { nombre: cat.nombre, descripcion: cat.descripcion, activo: cat.activo }
                        });
                        categoriasMap.set(cat.nombre.toLowerCase(), nueva.id);
                        resultado.categoriasCreadas++;
                    }
                } catch (error: any) {
                    resultado.errores.push(`Categoría "${cat.nombre}": ${error.message}`);
                }
            }
        }

        // Cargar categorías existentes en el mapa
        const todasCategorias = await prisma.categoria.findMany();
        todasCategorias.forEach(c => categoriasMap.set(c.nombre.toLowerCase(), c.id));

        // ==========================================
        // 2. Procesar Subcategorías
        // ==========================================
        const subcategoriasSheet = workbook.getWorksheet('Subcategorías') || workbook.getWorksheet('Subcategorias');
        if (subcategoriasSheet) {
            const subcategoriasData: Array<{ nombre: string; categoria: string; descripcion: string; activo: boolean }> = [];
            subcategoriasSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const nombre = String(row.getCell(1).value || '').trim();
                if (!nombre) return;

                subcategoriasData.push({
                    nombre,
                    categoria: String(row.getCell(2).value || '').trim(),
                    descripcion: String(row.getCell(3).value || '').trim(),
                    activo: CartaExcelService.parsearBooleano(row.getCell(4).value),
                });
            });

            for (const sub of subcategoriasData) {
                try {
                    const categoriaId = categoriasMap.get(sub.categoria.toLowerCase());
                    if (!categoriaId) {
                        resultado.errores.push(`Subcategoría "${sub.nombre}": Categoría "${sub.categoria}" no encontrada`);
                        continue;
                    }

                    const existente = await prisma.subcategoria.findFirst({
                        where: {
                            nombre: { equals: sub.nombre, mode: 'insensitive' },
                            categoriaId
                        }
                    });

                    if (!existente) {
                        await prisma.subcategoria.create({
                            data: {
                                nombre: sub.nombre,
                                categoriaId,
                                descripcion: sub.descripcion,
                                activo: sub.activo,
                            }
                        });
                        resultado.subcategoriasCreadas++;
                    }
                } catch (error: any) {
                    resultado.errores.push(`Subcategoría "${sub.nombre}": ${error.message}`);
                }
            }
        }

        // ==========================================
        // 3. Procesar Grupos de Modificadores
        // ==========================================
        const gruposMap = new Map<string, string>(); // nombre -> id
        const gruposSheet = workbook.getWorksheet('Grupos Modificadores');
        if (gruposSheet) {
            const gruposData: Array<{ nombre: string; descripcion: string; requerido: boolean; cobrar_precio: boolean; activo: boolean }> = [];
            gruposSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const nombre = String(row.getCell(1).value || '').trim();
                if (!nombre) return;

                gruposData.push({
                    nombre,
                    descripcion: String(row.getCell(2).value || '').trim(),
                    requerido: CartaExcelService.parsearBooleano(row.getCell(3).value),
                    cobrar_precio: CartaExcelService.parsearBooleano(row.getCell(4).value),
                    activo: CartaExcelService.parsearBooleano(row.getCell(5).value),
                });
            });

            for (const grupo of gruposData) {
                try {
                    const existente = await prisma.grupoModificador.findFirst({
                        where: { nombre: { equals: grupo.nombre, mode: 'insensitive' } }
                    });

                    if (existente) {
                        gruposMap.set(grupo.nombre.toLowerCase(), existente.id);
                    } else {
                        const nuevo = await prisma.grupoModificador.create({
                            data: {
                                nombre: grupo.nombre,
                                descripcion: grupo.descripcion,
                                requerido: grupo.requerido,
                                cobrar_precio: grupo.cobrar_precio,
                                activo: grupo.activo,
                            }
                        });
                        gruposMap.set(grupo.nombre.toLowerCase(), nuevo.id);
                        resultado.gruposCreados++;
                    }
                } catch (error: any) {
                    resultado.errores.push(`Grupo modificador "${grupo.nombre}": ${error.message}`);
                }
            }
        }

        // Cargar grupos existentes en el mapa
        const todosGrupos = await prisma.grupoModificador.findMany();
        todosGrupos.forEach(g => gruposMap.set(g.nombre.toLowerCase(), g.id));

        // ==========================================
        // 4. Procesar Opciones de Modificador
        // ==========================================
        const opcionesSheet = workbook.getWorksheet('Opciones Modificador');
        if (opcionesSheet) {
            const opcionesData: Array<{ nombre: string; grupo: string; precioAdicional: number; activo: boolean }> = [];
            opcionesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const nombre = String(row.getCell(1).value || '').trim();
                if (!nombre) return;

                opcionesData.push({
                    nombre,
                    grupo: String(row.getCell(2).value || '').trim(),
                    precioAdicional: CartaExcelService.parsearNumero(row.getCell(3).value),
                    activo: CartaExcelService.parsearBooleano(row.getCell(4).value),
                });
            });

            for (const opcion of opcionesData) {
                try {
                    const grupoId = gruposMap.get(opcion.grupo.toLowerCase());
                    if (!grupoId) {
                        resultado.errores.push(`Opción "${opcion.nombre}": Grupo "${opcion.grupo}" no encontrado`);
                        continue;
                    }

                    const existente = await prisma.opcionModificador.findFirst({
                        where: {
                            nombre: { equals: opcion.nombre, mode: 'insensitive' },
                            grupoId
                        }
                    });

                    if (!existente) {
                        await prisma.opcionModificador.create({
                            data: {
                                nombre: opcion.nombre,
                                grupoId,
                                precioAdicional: opcion.precioAdicional,
                                activo: opcion.activo,
                            }
                        });
                        resultado.opcionesCreadas++;
                    }
                } catch (error: any) {
                    resultado.errores.push(`Opción "${opcion.nombre}": ${error.message}`);
                }
            }
        }

        // ==========================================
        // 5. Procesar Productos (lo más importante)
        // ==========================================
        const productosSheet = workbook.getWorksheet('Productos');
        if (productosSheet) {
            const productosData: Array<{
                nombre: string; descripcion: string; precio: number;
                categoria: string; subcategoria: string; activo: boolean; especial: boolean;
            }> = [];

            productosSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const nombre = String(row.getCell(1).value || '').trim();
                if (!nombre) return;

                productosData.push({
                    nombre,
                    descripcion: String(row.getCell(2).value || '').trim(),
                    precio: CartaExcelService.parsearNumero(row.getCell(3).value),
                    categoria: String(row.getCell(4).value || '').trim(),
                    subcategoria: String(row.getCell(5).value || '').trim(),
                    activo: CartaExcelService.parsearBooleano(row.getCell(6).value),
                    especial: CartaExcelService.parsearBooleano(row.getCell(7).value),
                });
            });

            for (const prod of productosData) {
                try {
                    // Buscar o crear categoría
                    let categoriaId = categoriasMap.get(prod.categoria.toLowerCase());
                    if (!categoriaId && prod.categoria) {
                        // Crear categoría al vuelo
                        const nuevaCat = await prisma.categoria.create({
                            data: { nombre: prod.categoria }
                        });
                        categoriaId = nuevaCat.id;
                        categoriasMap.set(prod.categoria.toLowerCase(), categoriaId);
                        resultado.categoriasCreadas++;
                    }

                    if (!categoriaId) {
                        resultado.errores.push(`Producto "${prod.nombre}": Categoría "${prod.categoria}" vacía o no válida`);
                        continue;
                    }

                    // Verificar si ya existe el producto por nombre + categoría
                    const existente = await prisma.producto.findFirst({
                        where: {
                            nombre: { equals: prod.nombre, mode: 'insensitive' },
                            categoriaId
                        }
                    });

                    if (existente) {
                        await prisma.producto.update({
                            where: { id: existente.id },
                            data: {
                                descripcion: prod.descripcion || existente.descripcion,
                                precio: prod.precio,
                                subcategoria: prod.subcategoria || existente.subcategoria,
                                activo: prod.activo,
                                especial: prod.especial,
                            }
                        });
                        resultado.productosActualizados++;
                    } else {
                        await prisma.producto.create({
                            data: {
                                nombre: prod.nombre,
                                descripcion: prod.descripcion,
                                precio: prod.precio,
                                categoriaId,
                                subcategoria: prod.subcategoria || null,
                                activo: prod.activo,
                                especial: prod.especial,
                            }
                        });
                        resultado.productosCreados++;
                    }
                } catch (error: any) {
                    resultado.errores.push(`Producto "${prod.nombre}": ${error.message}`);
                }
            }
        }

        // ==========================================
        // 6. Procesar Comentarios Preestablecidos
        // ==========================================
        const comentariosSheet = workbook.getWorksheet('Comentarios Preestablecidos') || workbook.getWorksheet('Comentarios');
        if (comentariosSheet) {
            const comentariosData: Array<{ texto: string; activo: boolean }> = [];
            comentariosSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const texto = String(row.getCell(1).value || '').trim();
                if (!texto) return;

                comentariosData.push({
                    texto,
                    activo: CartaExcelService.parsearBooleano(row.getCell(2).value),
                });
            });

            for (const com of comentariosData) {
                try {
                    const existente = await prisma.comentarioPreestablecido.findFirst({
                        where: { texto: { equals: com.texto, mode: 'insensitive' } }
                    });

                    if (!existente) {
                        await prisma.comentarioPreestablecido.create({
                            data: {
                                texto: com.texto,
                                activo: com.activo,
                            }
                        });
                        resultado.comentariosCreados++;
                    }
                } catch (error: any) {
                    resultado.errores.push(`Comentario "${com.texto}": ${error.message}`);
                }
            }
        }

        return resultado;
    }

    // ==========================================
    // Utilidades
    // ==========================================

    private static estiloEncabezado(sheet: ExcelJS.Worksheet, color: string) {
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: `FF${color}` },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 28;

        // Bordes
        headerRow.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'medium' },
                right: { style: 'thin' },
            };
        });

        // Activar filtros automáticos
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: sheet.columnCount },
        };

        // Congelar primera fila
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    private static crearHojaInstrucciones(workbook: ExcelJS.Workbook) {
        const sheet = workbook.addWorksheet('📋 Instrucciones');
        sheet.properties.tabColor = { argb: 'FF00B050' };

        // Columna A ancha para el contenido
        sheet.getColumn(1).width = 90;
        sheet.getColumn(2).width = 40;

        const tituloRow = sheet.addRow(['📋 INSTRUCCIONES PARA LLENAR LA CARTA']);
        tituloRow.font = { bold: true, size: 18, color: { argb: 'FF1F4E79' } };
        tituloRow.height = 35;

        sheet.addRow([]);
        const introRow = sheet.addRow(['Este archivo contiene la carta completa del restaurante. Puedes editarlo y volver a importarlo para actualizar tu menú.']);
        introRow.font = { size: 12, italic: true, color: { argb: 'FF666666' } };

        sheet.addRow([]);

        // ---- Reglas generales ----
        const generalRow = sheet.addRow(['⚠️  REGLAS GENERALES']);
        generalRow.font = { bold: true, size: 14, color: { argb: 'FFC00000' } };
        sheet.addRow([]);

        const reglas = [
            ['1.', 'NO renombres las hojas (pestañas). El sistema las busca por nombre exacto.'],
            ['2.', 'NO elimines ni cambies el orden de las columnas (la fila 1 es el encabezado).'],
            ['3.', 'Puedes agregar nuevas filas al final de cada hoja para añadir registros nuevos.'],
            ['4.', 'Los campos "Activo" aceptan: Sí, No, Si, true, false, 1, 0.'],
            ['5.', 'Si un producto ya existe con el mismo nombre y categoría, se ACTUALIZA (no se duplica).'],
            ['6.', 'Si una categoría no existe al importar productos, se crea automáticamente.'],
            ['7.', 'Las filas vacías o sin nombre se ignoran automáticamente.'],
            ['8.', 'El orden de las hojas importa: Primero Categorías, luego Subcategorías, después Productos, etc.'],
        ];

        reglas.forEach(([num, texto]) => {
            const row = sheet.addRow([`   ${num}  ${texto}`]);
            row.font = { size: 11 };
            row.height = 22;
        });

        sheet.addRow([]);

        // ---- Detalle por hoja ----
        const detalleRow = sheet.addRow(['📑  DETALLE POR HOJA']);
        detalleRow.font = { bold: true, size: 14, color: { argb: 'FF4472C4' } };
        sheet.addRow([]);

        const hojas = [
            {
                nombre: '📘 Categorías',
                color: '4472C4',
                columnas: [
                    ['Nombre', 'Nombre de la categoría (ej: Helados, Bebidas, Postres). OBLIGATORIO.'],
                    ['Descripción', 'Descripción opcional de la categoría.'],
                    ['Activo', 'Si la categoría está activa en el menú (Sí/No).'],
                ],
            },
            {
                nombre: '📗 Subcategorías',
                color: '548235',
                columnas: [
                    ['Nombre', 'Nombre de la subcategoría (ej: "De Agua" dentro de "Helados"). OBLIGATORIO.'],
                    ['Categoría', 'Nombre EXACTO de la categoría a la que pertenece. Debe existir en la hoja Categorías.'],
                    ['Descripción', 'Descripción opcional.'],
                    ['Activo', 'Si está activa (Sí/No).'],
                ],
            },
            {
                nombre: '📕 Productos',
                color: 'C00000',
                columnas: [
                    ['Nombre', 'Nombre del producto (ej: "Helado de Vainilla"). OBLIGATORIO.'],
                    ['Descripción', 'Descripción o detalle del producto.'],
                    ['Precio', 'Precio de venta (número, ej: 2500 o 2500.00). OBLIGATORIO.'],
                    ['Categoría', 'Nombre EXACTO de la categoría. Si no existe, se crea automáticamente.'],
                    ['Subcategoría', 'Nombre de la subcategoría (opcional). Debe existir previamente.'],
                    ['Activo', 'Si está activo para la venta (Sí/No).'],
                    ['Especial', 'Si el producto tiene modificadores (Sí/No). Ej: "Sí" para un helado con sabores.'],
                ],
            },
            {
                nombre: '📙 Grupos Modificadores',
                color: '7030A0',
                columnas: [
                    ['Nombre', 'Nombre del grupo (ej: "Sabores", "Toppings"). OBLIGATORIO.'],
                    ['Descripción', 'Descripción del grupo.'],
                    ['Requerido', 'Si el cliente DEBE elegir al menos una opción (Sí/No).'],
                    ['Cobrar Precio', 'Si las opciones tienen precio adicional (Sí/No).'],
                    ['Activo', 'Si está activo (Sí/No).'],
                ],
            },
            {
                nombre: '📒 Opciones Modificador',
                color: 'ED7D31',
                columnas: [
                    ['Nombre', 'Nombre de la opción (ej: "Chocolate", "Extra crema"). OBLIGATORIO.'],
                    ['Grupo', 'Nombre EXACTO del grupo modificador al que pertenece.'],
                    ['Precio Adicional', 'Costo extra por elegir esta opción (0 si no tiene).'],
                    ['Activo', 'Si está activa (Sí/No).'],
                ],
            },
            {
                nombre: '💬 Comentarios Preestablecidos',
                color: '00B050',
                columnas: [
                    ['Texto', 'Texto del comentario rápido (ej: "Sin azúcar", "Extra caliente"). OBLIGATORIO.'],
                    ['Activo', 'Si está disponible para usar (Sí/No).'],
                ],
            },
        ];

        hojas.forEach(hoja => {
            const headerRow = sheet.addRow([`  ${hoja.nombre}`]);
            headerRow.font = { bold: true, size: 13, color: { argb: `FF${hoja.color}` } };
            headerRow.height = 24;

            hoja.columnas.forEach(([col, desc]) => {
                const row = sheet.addRow([`      • ${col}:  ${desc}`]);
                row.font = { size: 10, color: { argb: 'FF333333' } };
                row.height = 20;
            });

            sheet.addRow([]);
        });

        // ---- Ejemplo ----
        sheet.addRow([]);
        const ejRow = sheet.addRow(['💡  EJEMPLO RÁPIDO']);
        ejRow.font = { bold: true, size: 14, color: { argb: 'FF00B050' } };
        sheet.addRow([]);

        const ejemplos = [
            'Para agregar un nuevo producto "Brownie con Helado" a $8.500:',
            '   1. Ve a la hoja "Productos"',
            '   2. En la última fila, escribe:',
            '       Nombre: Brownie con Helado',
            '       Descripción: Brownie tibio con bola de helado de vainilla',
            '       Precio: 8500',
            '       Categoría: Postres   (si no existe, se crea sola)',
            '       Activo: Sí',
            '       Especial: No',
            '   3. Guarda el archivo e impórtalo desde el POS.',
        ];

        ejemplos.forEach(texto => {
            const row = sheet.addRow([texto]);
            row.font = { size: 11, color: { argb: 'FF444444' } };
            row.height = 20;
        });

        // Proteger la hoja de instrucciones (solo lectura)
        sheet.protect('', {
            selectLockedCells: true,
            selectUnlockedCells: true,
        });
    }

    private static parsearBooleano(value: any): boolean {
        if (typeof value === 'boolean') return value;
        const str = String(value || '').trim().toLowerCase();
        return str === 'sí' || str === 'si' || str === 'true' || str === '1' || str === 'yes';
    }

    private static parsearNumero(value: any): number {
        if (typeof value === 'number') return value;
        const str = String(value || '0').replace(/[^0-9.,\-]/g, '').replace(',', '.');
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }
}
