import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productoRoutes from './producto.routes.js';
import mesaRoutes from './mesa.routes.js';
import gastoRoutes from './gasto.routes.js';
import categoriaRoutes from './categoria.routes.js';
import categoriaGastoRoutes from './categoria-gasto.routes.js';
import grupoModificadorRoutes from './grupo-modificador.routes.js';
import ordenRoutes from './orden.routes.js';
import comentarioRoutes from './comentario.routes.js';
import comentarioPreestablecidoRoutes from './comentario-preestablecido.routes.js';
import usuarioRoutes from './usuario.routes.js';
import rolRoutes from './rol.routes.js';
import printerRoutes from './printer.routes.js';
import proveedorRoutes from './proveedor.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/mesas', mesaRoutes);
router.use('/gastos', gastoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/categoria-gastos', categoriaGastoRoutes);
router.use('/grupos-modificadores', grupoModificadorRoutes);
router.use('/ordenes', ordenRoutes);
router.use('/comentarios', comentarioRoutes);
router.use('/comentarios-preestablecidos', comentarioPreestablecidoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/roles', rolRoutes);
router.use('/printer', printerRoutes);
router.use('/proveedores', proveedorRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
