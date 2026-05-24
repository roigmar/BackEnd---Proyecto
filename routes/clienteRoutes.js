import express from 'express';
import * as clienteController from '../controllers/clienteController.js';
const router = express.Router();

// Rutas para /clientes
router.post('/', clienteController.crearCliente);
router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerClientePorId);
router.put('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

export default router;
