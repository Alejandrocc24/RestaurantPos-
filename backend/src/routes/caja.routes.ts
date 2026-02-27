import { Router } from 'express';
import { CajaController } from '../controllers/caja.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Rutas protegidas para caja (desarrollo: almacenamiento en memoria)
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', CajaController.getAll);
router.post('/', CajaController.create);
router.get('/:id', CajaController.getById);
router.patch('/:id', CajaController.update);
router.delete('/:id', CajaController.remove);

export default router;
