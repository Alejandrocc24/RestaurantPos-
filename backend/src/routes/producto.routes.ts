import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', ProductoController.getAll);
router.get('/:id', ProductoController.getById);
router.post('/', ProductoController.create);
router.put('/:id', ProductoController.update);
router.delete('/:id', ProductoController.delete);

export default router;
