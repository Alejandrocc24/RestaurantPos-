import { Router } from 'express';
import { BackupController } from '../controllers/backup.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de backup requieren estar autenticado
router.use(authMiddleware);

router.get('/list', BackupController.listBackups);
router.post('/create', BackupController.createBackup);
router.get('/download/:id', BackupController.downloadBackup);
router.delete('/delete/:id', BackupController.deleteBackup);
router.get('/url/:id', BackupController.getDownloadUrl);
router.post('/restore', BackupController.restoreBackup);

export default router;
