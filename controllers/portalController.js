const crypto = require('crypto');
const Usuario = require('../models/usuario');
const Producto = require('../models/producto');
const { obtenerSesion, crearSesion, destruirSesion } = require('../utils/sesion');

function hashPassword(plain) {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

function fechaHoy() {
    return new Date().toISOString().split('T')[0];
}


// GET /portal/login
exports.mostrarLogin = (req, res) => {
    if (obtenerSesion(req)) return res.redirect('/portal');
    res.render('login', { error: null });
};

// POST /portal/login  (compartido con admin)
exports.procesarLogin = async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.render('login', { error: 'Completá todos los campos.' });
    }

    try {
        const usuarioEncontrado = await Usuario.findOne({
            usuario: usuario.trim().toLowerCase(),
            activo: true
        }).populate('clienteId');

        if (!usuarioEncontrado || hashPassword(password) !== usuarioEncontrado.password) {
            return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
        }

        // Admin: no tiene cliente asociado
        if (usuarioEncontrado.rol === 'ADMIN') {
            crearSesion(res, {
                usuarioId: usuarioEncontrado._id.toString(),
                usuario:   usuarioEncontrado.usuario,
                rol:       'ADMIN',
                nombre:    'Administrador'
            });
            return res.redirect('/admin');
        }

        // Cliente: sucursal o franquicia
        const cliente = usuarioEncontrado.clienteId;
        if (!cliente || !cliente.activo) {
            return res.render('login', { error: 'Tu cuenta está desactivada. Contactá a administración.' });
        }

        crearSesion(res, {
            usuarioId: usuarioEncontrado._id.toString(),
            usuario:   usuarioEncontrado.usuario,
            rol:       'CLIENTE',
            clienteId: cliente._id.toString(),
            nombre:    cliente.nombre,
            tipo:      cliente.tipo,
            zona:      cliente.configuracion_logistica?.zona_reparto || ''
        });
        res.redirect('/portal');

    } catch (err) {
        console.error('Error en login:', err);
        res.render('login', { error: 'Error interno. Intentá de nuevo.' });
    }
};

// GET /portal  (solo CLIENTE)
exports.mostrarPortal = (req, res) => {
    const sesion = obtenerSesion(req);
    if (!sesion) return res.redirect('/portal/login');
    if (sesion.rol === 'ADMIN') return res.redirect('/admin');
    res.render('portal', { sesion });
};

// GET /portal/nuevo-pedido  (solo CLIENTE)
exports.mostrarNuevoPedido = async (req, res) => {
    const sesion = obtenerSesion(req);
    if (!sesion) return res.redirect('/portal/login');
    if (sesion.rol === 'ADMIN') return res.redirect('/admin');

    try {
        const productos = await Producto.find().lean();
        res.render('nuevo-pedido', { sesion, productos, fechaHoy: fechaHoy(), error: null });
    } catch (err) {
        res.status(500).render('nuevo-pedido', {
            sesion, productos: [], fechaHoy: fechaHoy(),
            error: 'No se pudo cargar el catálogo de productos.'
        });
    }
};

// GET /portal/logout
exports.logout = (req, res) => {
    destruirSesion(req, res);
    res.redirect('/portal/login');
};
