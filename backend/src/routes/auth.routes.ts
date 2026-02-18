import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware, optionalTenantMiddleware } from '../middleware/auth.js';
import { ensurePrismaMiddleware } from '../middleware/request.js';

const router = Router();

// Rutas públicas (requieren tenantId pero no JWT)
router.post('/login', optionalTenantMiddleware, ensurePrismaMiddleware, AuthController.login);
router.post('/register', optionalTenantMiddleware, ensurePrismaMiddleware, AuthController.register);
router.post('/logout', (req, res) => {
    // El logout se maneja en el frontend limpiando localStorage
    res.json({ success: true, message: 'Logout exitoso' });
});

// Rutas protegidas (requieren JWT)
router.get('/me', authMiddleware, ensurePrismaMiddleware, AuthController.getMe);
router.put('/password', authMiddleware, ensurePrismaMiddleware, AuthController.updatePassword);

export default router;
