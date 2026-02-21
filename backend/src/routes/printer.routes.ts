import { Router } from 'express';
import { PrinterController } from '../controllers/printer.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de impresora
router.get('/available', PrinterController.getAvailablePrinters);
router.get('/config', PrinterController.getPrinterConfig);
router.get('/status', PrinterController.getPrinterStatus);
router.post('/config', PrinterController.savePrinterConfig);

export default router;
