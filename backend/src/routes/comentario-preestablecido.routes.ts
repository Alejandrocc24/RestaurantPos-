import { Router } from 'express';
import { ComentarioPreestablecidoController } from '../controllers/comentario-preestablecido.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD básico
router.get('/', ComentarioPreestablecidoController.getAll);
router.get('/:id', ComentarioPreestablecidoController.getById);
router.post('/', ComentarioPreestablecidoController.create);
router.put('/:id', ComentarioPreestablecidoController.update);
router.delete('/:id', ComentarioPreestablecidoController.delete);

export default router;
