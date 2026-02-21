import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de usuarios
router.get('/', UsuarioController.getUsuarios);
router.get('/:id', UsuarioController.getUsuarioById);
router.post('/', UsuarioController.createUsuario);
router.patch('/:id', UsuarioController.updateUsuario);
router.delete('/:id', UsuarioController.deleteUsuario);

export default router;
