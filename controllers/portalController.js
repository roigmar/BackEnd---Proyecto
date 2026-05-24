import Usuario from '../models/usuario.js';
import Producto from '../models/producto.js';
import Cliente from '../models/cliente.js';
import Pedido from '../models/pedido.js';

function fechaHoy() {
    return new Date().toISOString().split('T')[0];
}

// GET /portal/login
export const mostrarLogin = (req, res) => {
    res.render('login', { error: null });
};

// POST /portal/login
export const procesarLogin = async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.render('login', { error: 'Completá todos los campos.' });
    }

    try {
        const usuarioEncontrado = await Usuario.findOne({
            usuario: usuario.trim().toLowerCase(),
            activo:  true
        });

        if (!usuarioEncontrado || password !== usuarioEncontrado.password) {
            return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
        }

        if (usuarioEncontrado.rol === 'ADMIN') return res.redirect('/admin');
        res.redirect('/portal');

    } catch (err) {
        console.error('Error en login:', err);
        res.render('login', { error: 'Error interno. Intentá de nuevo.' });
    }
};

// GET /portal
export const mostrarPortal = (req, res) => {
    res.render('portal');
};

// GET /portal/nuevo-pedido
export const mostrarNuevoPedido = async (req, res) => {
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
export const mostrarMisPedidos = async (req, res) => {
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
export const logout = (req, res) => {
    res.redirect('/portal/login');
};