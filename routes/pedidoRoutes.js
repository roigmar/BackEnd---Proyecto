import express from 'express';
import * as pedidoController from '../controllers/pedidoController.js';
const router = express.Router();

router.post('/', pedidoController.crearPedido);
router.get('/', pedidoController.obtenerPedidos);
router.get('/:id', pedidoController.obtenerPedidoPorId);
router.patch('/:id/estado', pedidoController.actualizarEstadoPedido);

export default router;