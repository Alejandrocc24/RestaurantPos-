import { Router } from 'express';
import { ProveedorController } from '../controllers/proveedor.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', ProveedorController.getAll);
router.get('/:id', ProveedorController.getById);
router.post('/', ProveedorController.create);
router.patch('/:id', ProveedorController.update);
router.delete('/:id', ProveedorController.delete);

export default router;
