import express from 'express';
import * as portalController from '../controllers/portalController.js';
import { requiereCliente } from '../middlewares/auth.js';

const router = express.Router();

// Login
router.get('/login', portalController.mostrarLogin);
router.post('/login', portalController.procesarLogin);

// Cambio obligatorio de contraseña
router.get(
    '/cambiar-password',
    requiereCliente,
    portalController.mostrarCambiarPassword
);

router.post(
    '/cambiar-password',
    requiereCliente,
    portalController.procesarCambiarPassword
);

// Logout
router.get('/logout', portalController.logout);

// Home del portal (requiere sesión)
router.get('/', requiereCliente, portalController.mostrarPortal);

// Formulario de nuevo pedido
router.get('/nuevo-pedido', requiereCliente, portalController.mostrarNuevoPedido);

// Mis pedidos
router.get('/mis-pedidos', requiereCliente, portalController.mostrarMisPedidos);

export default router;