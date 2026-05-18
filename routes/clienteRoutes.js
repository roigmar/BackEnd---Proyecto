const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rutas para /clientes
router.post('/', clienteController.crearCliente);
router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerClientePorId);
router.put('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

module.exports = router;
