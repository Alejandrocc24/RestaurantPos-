import { Router } from 'express';
import { MesaController } from '../controllers/mesa.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

// Rutas específicas primero (ninguna en este caso)

// Rutas genéricas
router.get('/', MesaController.getAll);
router.post('/', MesaController.create);
router.get('/:id', MesaController.getById);
router.patch('/:id', MesaController.update);
router.put('/:id', MesaController.updateEstado);
router.delete('/:id', MesaController.delete);

export default router;
