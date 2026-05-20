const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/',                 adminController.mostrarAdmin);
router.get('/pedidos',          adminController.mostrarPedidos);
router.get('/productos',        adminController.catalogo);
router.get('/productos/nuevo',  adminController.formularioNuevo);
router.post('/productos/nuevo', adminController.crearProductoVista);
router.get('/logout',           adminController.logout);

module.exports = router;
