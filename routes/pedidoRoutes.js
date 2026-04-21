const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.post('/', pedidoController.crearPedido);
router.get('/', pedidoController.obtenerPedidos);
router.get('/:id', pedidoController.obtenerPedidoPorId);
router.patch('/:id/estado', pedidoController.actualizarEstadoPedido);

module.exports = router;