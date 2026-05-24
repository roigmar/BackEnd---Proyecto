import express from 'express';
import * as adminController from '../controllers/adminController.js';
const router = express.Router();

router.get('/',                 adminController.mostrarAdmin);
router.get('/pedidos',          adminController.mostrarPedidos);
router.get('/productos',        adminController.catalogo);
router.get('/productos/nuevo',  adminController.formularioNuevo);
router.post('/productos/nuevo', adminController.crearProductoVista);
router.get('/logout',           adminController.logout);

export default router;
