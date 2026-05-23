const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');

// Login
router.get('/login', portalController.mostrarLogin);
router.post('/login', portalController.procesarLogin);

// Logout
router.get('/logout', portalController.logout);

// Home del portal (requiere sesión)
router.get('/', portalController.mostrarPortal);

// Formulario de nuevo pedido
router.get('/nuevo-pedido', portalController.mostrarNuevoPedido);

// Mis pedidos
router.get('/mis-pedidos', portalController.mostrarMisPedidos);

module.exports = router;
