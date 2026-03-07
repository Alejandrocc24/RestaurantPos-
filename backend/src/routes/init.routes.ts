import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

router.use(authMiddleware, ensurePrismaMiddleware);

/**
 * GET /api/init
 * Carga TODOS los datos iniciales (mesas, productos, categorías, grupos) en UN SOLO viaje de red.
 * Reemplaza 4 llamadas separadas que antes tardaban ~2s cada una = ~8s total.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const t0 = Date.now();

        const result: any[] = await req.prisma.$queryRawUnsafe(
            `SELECT cargar_datos_iniciales() as data`
        );

        const data = result[0]?.data;
        console.log(`✅ [SP] Datos iniciales cargados en ${Date.now() - t0}ms | Mesas: ${data?.mesas?.length} | Productos: ${data?.productos?.length} | Categorías: ${data?.categorias?.length} | Grupos: ${data?.gruposModificadores?.length}`);

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('❌ Error cargando datos iniciales:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Error cargando datos iniciales',
        });
    }
});

export default router;
