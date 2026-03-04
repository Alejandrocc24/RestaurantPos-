import { Router } from 'express';
import { OrdenController } from '../controllers/orden.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Todas son rutas protegidas
router.use(authMiddleware, ensurePrismaMiddleware);

// NOTA: Las rutas específicas deben ir SIEMPRE antes de las genéricas para que Express las matchee correctamente
// Rutas con segments específicos primero (mayor a menor especificidad)
router.patch('/:ordenId/cantidades', OrdenController.updateCantidades); // Actualizar cantidades para cierre de cuenta
router.get('/mesa/:mesaId/activa', OrdenController.getActiveForMesa); // Obtener orden activa de una mesa
router.get('/mesa/:mesaId', OrdenController.getByMesa); // Obtener todas las órdenes de una mesa
router.post('/mesa/:mesaId', OrdenController.createForMesa); // Crear orden para una mesa específica

// Rutas genéricas después (menor especificidad)
router.get('/', OrdenController.getAll);
router.post('/', OrdenController.create);
router.get('/:id', OrdenController.getById);
router.patch('/:id', OrdenController.update);
router.delete('/:id', OrdenController.delete);

export default router;
