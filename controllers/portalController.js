const Usuario = require('../models/usuario');
const Producto = require('../models/producto');
const Cliente  = require('../models/cliente');
const Pedido   = require('../models/pedido');

function fechaHoy() {
    return new Date().toISOString().split('T')[0];
}

// GET /portal/login
exports.mostrarLogin = (req, res) => {
    res.render('login', { error: null });
};

// POST /portal/login
// Valida credenciales contra la BD. Si son correctas redirige al portal.
exports.procesarLogin = async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.render('login', { error: 'Completá todos los campos.' });
    }

    try {
        const usuarioEncontrado = await Usuario.findOne({
            usuario: usuario.trim().toLowerCase(),
            activo:  true
        });

        // Comparación directa
        if (!usuarioEncontrado || password !== usuarioEncontrado.password) {
            return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
        }

        // Redirigir según el rol del usuario
        if (usuarioEncontrado.rol === 'ADMIN') return res.redirect('/admin');
        res.redirect('/portal');

    } catch (err) {
        console.error('Error en login:', err);
        res.render('login', { error: 'Error interno. Intentá de nuevo.' });
    }
};

// GET /portal
exports.mostrarPortal = (req, res) => {
    res.render('portal');
};

// GET /portal/nuevo-pedido
exports.mostrarNuevoPedido = async (req, res) => {
    try {
        const productos = await Producto.find().lean();
        const clientes  = await Cliente.find({ activo: true }).lean();
        res.render('nuevo-pedido', { productos, clientes, fechaHoy: fechaHoy(), error: null });
    } catch (err) {
        res.status(500).render('nuevo-pedido', {
            productos: [], clientes: [], fechaHoy: fechaHoy(),
            error: 'No se pudo cargar el formulario.'
        });
    }
};

// GET /portal/mis-pedidos
exports.mostrarMisPedidos = async (req, res) => {
    try {
        const { clienteId } = req.query;
        const clientes = await Cliente.find({ activo: true }).lean();
        
        let pedidos = [];
        if (clienteId) {
            pedidos = await Pedido.find({ clienteId })
                .populate('detalles.productoId', 'nombre')
                .sort({ fecha: -1 })
                .lean();
        }
        
        res.render('mis-pedidos', { clientes, pedidos, clienteId, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).render('mis-pedidos', {
            clientes: [], pedidos: [], clienteId: null,
            error: 'Error al cargar los pedidos.'
        });
    }
};

// GET /portal/logout
exports.logout = (req, res) => {
    res.redirect('/portal/login');
};
