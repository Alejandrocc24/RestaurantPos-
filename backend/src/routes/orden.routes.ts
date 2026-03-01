import { Router } from 'express';
import { OrdenController } from '../controllers/orden.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', OrdenController.getAll);
router.get('/:id', OrdenController.getById);
// NOTA: Las rutas específicas deben ir antes de las genéricas para que Express las matchee correctamente
router.get('/mesa/:mesaId/activa', OrdenController.getActiveForMesa); // Obtener orden activa de una mesa
router.get('/mesa/:mesaId', OrdenController.getByMesa); // Obtener todas las órdenes de una mesa
router.post('/', OrdenController.create);
router.post('/mesa/:mesaId', OrdenController.createForMesa); // Crear orden para una mesa específica
router.patch('/:id', OrdenController.update);
router.delete('/:id', OrdenController.delete);

export default router;
