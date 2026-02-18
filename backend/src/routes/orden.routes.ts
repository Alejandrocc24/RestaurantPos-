import { Router } from 'express';
import { OrdenController } from '../controllers/orden.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', OrdenController.getAll);
router.get('/mesa/:mesaId', OrdenController.getByMesa);
router.get('/:id', OrdenController.getById);
router.post('/', OrdenController.create);
router.patch('/:id', OrdenController.update);
router.delete('/:id', OrdenController.delete);

export default router;
