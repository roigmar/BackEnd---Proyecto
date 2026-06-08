import express from 'express';
import * as productoController from '../controllers/productoController.js';
const router = express.Router();

router.post('/', productoController.crearProducto);
router.get('/', productoController.obtenerProductoPorNombre);

// Rutas para vistas Pug (deben ir antes de las rutas con :id)
router.get('/vista', productoController.obtenerProductosVista);
router.get('/nuevo', productoController.formularioNuevoProducto);
router.post('/vista', productoController.crearProductoVista);

router.get('/:id', productoController.obtenerProductoPorId);
router.patch('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

export default router;
