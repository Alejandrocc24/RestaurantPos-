import { Router } from 'express';
import { SalonController } from '../controllers/salon.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

router.use(authMiddleware, ensurePrismaMiddleware);

router.get('/', SalonController.getAll);
router.post('/', SalonController.create);
router.get('/:id', SalonController.getById);
router.patch('/:id', SalonController.update);
router.delete('/:id', SalonController.delete);

export default router;
