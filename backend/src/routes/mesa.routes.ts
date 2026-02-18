import { Router } from 'express';
import { MesaController } from '../controllers/mesa.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', MesaController.getAll);
router.put('/:id', MesaController.updateEstado);

export default router;
