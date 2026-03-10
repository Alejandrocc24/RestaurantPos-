import { Request, Response } from 'express';
import multer from 'multer';
import { CartaExcelService } from '../services/carta-excel.service.js';

// Configurar multer para almacenar en memoria
const storage = multer.memoryStorage();
export const uploadExcel = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ];
        if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});

export class CartaExcelController {

    /**
     * GET /api/carta-excel/exportar
     * Descargar la carta como archivo Excel
     */
    static async exportar(req: Request, res: Response) {
        try {
            const buffer = await CartaExcelService.exportarCarta(req.prisma);

            const fecha = new Date().toISOString().slice(0, 10);
            const fileName = `Carta_Menu_${fecha}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length.toString());

            res.send(buffer);
        } catch (error: any) {
            console.error('Error exportando carta a Excel:', error);
            res.status(500).json({
                success: false,
                error: 'Error al exportar la carta',
                details: error.message,
            });
        }
    }

    /**
     * POST /api/carta-excel/importar
     * Importar la carta desde un archivo Excel
     */
    static async importar(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No se proporcionó ningún archivo Excel',
                });
            }

            const resultado = await CartaExcelService.importarCarta(req.prisma, req.file.buffer);

            const totalCreados = resultado.categoriasCreadas + resultado.subcategoriasCreadas +
                resultado.productosCreados + resultado.gruposCreados + resultado.opcionesCreadas;
            const totalActualizados = resultado.categoriasActualizadas + resultado.productosActualizados;

            res.status(200).json({
                success: true,
                message: `Importación completada: ${totalCreados} creados, ${totalActualizados} actualizados`,
                resultado,
            });
        } catch (error: any) {
            console.error('Error importando carta desde Excel:', error);
            res.status(500).json({
                success: false,
                error: 'Error al importar la carta',
                details: error.message,
            });
        }
    }
}
