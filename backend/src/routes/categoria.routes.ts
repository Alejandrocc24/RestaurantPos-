import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', CategoriaController.getCategorias);
router.get('/:id', CategoriaController.getCategoriaById);
router.post('/', CategoriaController.createCategoria);
router.patch('/:id', CategoriaController.updateCategoria);
router.delete('/:id', CategoriaController.deleteCategoria);

export default router;
