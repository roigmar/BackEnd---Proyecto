import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as clienteController from '../controllers/clienteController.js';
import { requiereAdmin } from '../middlewares/auth.js';
const router = express.Router();

router.use(requiereAdmin);

router.get('/',                 adminController.mostrarAdmin);
router.get('/pedidos',          adminController.mostrarPedidos);
router.get('/productos',        adminController.catalogo);
router.get('/productos/:id/editar', adminController.formularioEditar);
router.get('/productos/nuevo',  adminController.formularioNuevo);
router.post('/productos/nuevo', adminController.crearProductoVista);
router.post('/productos/:id/editar', adminController.actualizarProductoVista);
// Rutas para gestión de clientes desde el panel admin
router.get('/clientes/nuevo',    adminController.formularioNuevoCliente);
router.post('/clientes/nuevo',   clienteController.crearCliente);
// Ruta para creación de usuarios desde el panel admin (formulario)
router.get('/usuarios/nuevo',    adminController.formularioNuevoUsuario);
router.get('/logout',           adminController.logout);

export default router;
