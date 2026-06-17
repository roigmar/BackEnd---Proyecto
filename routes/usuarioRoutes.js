import express from 'express';
import * as usuarioController from '../controllers/usuarioController.js';

const router = express.Router();

// POST /usuarios
router.post('/', usuarioController.crearUsuario);

export default router;
