import { Router } from 'express';
import { GrupoModificadorController } from '../controllers/grupo-modificador.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', GrupoModificadorController.getGrupos);
router.get('/:id', GrupoModificadorController.getGrupoById);
router.post('/', GrupoModificadorController.createGrupo);
router.patch('/:id', GrupoModificadorController.updateGrupo);
router.delete('/:id', GrupoModificadorController.deleteGrupo);

export default router;
