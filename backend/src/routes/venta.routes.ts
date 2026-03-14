import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';
import { VentaController } from '../controllers/venta.controller.js';

const router = Router();

router.use(authMiddleware, ensurePrismaMiddleware);

// Rutas específicas primero
router.get('/hoy', VentaController.getHoy);
router.post('/cobrar', VentaController.cobrarMesa);

// Rutas genéricas
router.get('/', VentaController.getAll);
router.post('/', VentaController.create);
router.get('/:id', VentaController.getById);
router.put('/:id', VentaController.update);
router.delete('/:id', VentaController.delete);

export default router;
