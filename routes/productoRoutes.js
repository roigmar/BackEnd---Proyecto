const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.post('/', productoController.crearProducto);
router.get('/', productoController.obtenerProductos);

// Rutas para vistas Pug (deben ir antes de las rutas con :id)
router.get('/vista', productoController.obtenerProductosVista);
router.get('/nuevo', productoController.formularioNuevoProducto);
router.post('/vista', productoController.crearProductoVista);

router.get('/:id', productoController.obtenerProductoPorId);
router.patch('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

module.exports = router;
