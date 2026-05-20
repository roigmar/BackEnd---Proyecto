const { obtenerSesion, destruirSesion } = require('../utils/sesion');
const Producto = require('../models/producto');
const Pedido   = require('../models/pedido');

// Middleware interno: verifica sesión de admin
function requireAdmin(req, res, next) {
    const sesion = obtenerSesion(req);
    if (!sesion) return res.redirect('/portal/login');
    if (sesion.rol !== 'ADMIN') return res.status(403).redirect('/portal');
    req.sesion = sesion;
    next();
}

// GET /admin
exports.mostrarAdmin = [requireAdmin, (req, res) => {
    res.render('admin', { sesion: req.sesion });
}];

// GET /admin/productos  (catálogo)
exports.catalogo = [requireAdmin, async (req, res) => {
    try {
        const productos = await Producto.find().lean();
        res.render('catalogo', { sesion: req.sesion, productos });
    } catch (err) {
        res.status(500).render('catalogo', { sesion: req.sesion, productos: [], error: 'Error al cargar productos.' });
    }
}];

// GET /admin/productos/nuevo
exports.formularioNuevo = [requireAdmin, (req, res) => {
    res.render('nuevo', { sesion: req.sesion, error: null });
}];

// POST /admin/productos/nuevo
exports.crearProductoVista = [requireAdmin, async (req, res) => {
    try {
        let { nombre, precio, descripcion, stock } = req.body;
        precio = parseFloat(precio);
        stock  = parseInt(stock, 10);

        if (!nombre || isNaN(precio) || !descripcion || isNaN(stock) || precio < 0 || stock < 0) {
            return res.render('nuevo', { sesion: req.sesion, error: 'Datos inválidos o incompletos.' });
        }

        const existe = await Producto.findOne({
            nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
        });
        if (existe) return res.render('nuevo', { sesion: req.sesion, error: 'El nombre del producto ya existe.' });

        await new Producto({ nombre, precio, descripcion, stock }).save();
        res.redirect('/admin/productos');

    } catch (err) {
        res.render('nuevo', { sesion: req.sesion, error: 'Error interno al guardar.' });
    }
}];

// GET /admin/pedidos
exports.mostrarPedidos = [requireAdmin, async (req, res) => {
    const { estado } = req.query;
    const filtro = estado ? { estado } : {};

    try {
        const pedidos = await Pedido.find(filtro)
            .populate('clienteId', 'nombre tipo configuracion_logistica.zona_reparto')
            .populate('detalles.productoId', 'nombre')
            .sort({ fecha: -1 })
            .lean();

        res.render('pedidos-admin', { sesion: req.sesion, pedidos, estadoFiltro: estado || '' });
    } catch (err) {
        console.error(err);
        res.status(500).render('pedidos-admin', {
            sesion: req.sesion, pedidos: [], estadoFiltro: '',
            error: 'Error al cargar los pedidos.'
        });
    }
}];

// GET /admin/logout
exports.logout = (req, res) => {
    destruirSesion(req, res);
    res.redirect('/portal/login');
};
