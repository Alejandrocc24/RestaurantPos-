import { Router } from 'express';
import { CategoriaGastoController } from '../controllers/categoria-gasto.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', CategoriaGastoController.getCategorias);
router.get('/:id', CategoriaGastoController.getCategoriaById);
router.post('/', CategoriaGastoController.createCategoria);
router.patch('/:id', CategoriaGastoController.updateCategoria);
router.delete('/:id', CategoriaGastoController.deleteCategoria);

export default router;
