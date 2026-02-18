import { Router } from 'express';
import { GastoController } from '../controllers/gasto.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', GastoController.getAll);
router.post('/', GastoController.create);
router.delete('/:id', GastoController.delete);

export default router;
