import { Router } from 'express';
import { RolController } from '../controllers/rol.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de roles
router.get('/', RolController.getRoles);
router.get('/:id', RolController.getRolById);
router.post('/', RolController.createRol);
router.patch('/:id', RolController.updateRol);
router.delete('/:id', RolController.deleteRol);

export default router;
