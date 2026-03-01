import { Router } from 'express';
import { ComentarioController } from '../controllers/comentario.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD básico
router.get('/', ComentarioController.getAll);
router.get('/:id', ComentarioController.getById);
router.post('/', ComentarioController.create);
router.put('/:id', ComentarioController.update);
router.delete('/:id', ComentarioController.delete);

// Rutas específicas
router.get('/orden/:ordenId', ComentarioController.getByOrdenId);

export default router;
