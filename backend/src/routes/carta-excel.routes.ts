import { Router } from 'express';
import { CartaExcelController, uploadExcel } from '../controllers/carta-excel.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas las rutas requieren autenticación y prisma
router.use(authMiddleware, ensurePrismaMiddleware);

// Exportar carta como Excel
router.get('/exportar', CartaExcelController.exportar);

// Importar carta desde Excel
router.post('/importar', uploadExcel.single('archivo'), CartaExcelController.importar);

export default router;
