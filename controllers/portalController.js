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
        }).populate('clienteId');

        if (!usuarioEncontrado || password !== usuarioEncontrado.password) {
            return res.render('login', { error: 'Usuario o contraseña incorrectos.' });
        }

        // Guardar datos del usuario en la sesión
        req.session.usuario = {
            _id: usuarioEncontrado._id,
            usuario: usuarioEncontrado.usuario,
            rol: usuarioEncontrado.rol,
            clienteId: usuarioEncontrado.clienteId ? usuarioEncontrado.clienteId._id.toString() : null,
            clienteNombre: usuarioEncontrado.clienteId ? usuarioEncontrado.clienteId.nombre : null
        };

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
        const cliente = {
            _id: req.session.usuario.clienteId,
            nombre: req.session.usuario.clienteNombre
        };
        res.render('nuevo-pedido', { productos, cliente, fechaHoy: fechaHoy(), error: null });
    } catch (err) {
        res.status(500).render('nuevo-pedido', {
            productos: [], cliente: null, fechaHoy: fechaHoy(),
            error: 'No se pudo cargar el formulario.'
        });
    }
};

// GET /portal/mis-pedidos
export const mostrarMisPedidos = async (req, res) => {
    try {
        const clienteId = req.session.usuario.clienteId;
        const clienteNombre = req.session.usuario.clienteNombre;
        
        const pedidos = await Pedido.find({ clienteId })
            .populate('detalles.productoId', 'nombre')
            .sort({ fecha: -1 })
            .lean();
        
        res.render('mis-pedidos', { pedidos, clienteId, clienteNombre, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).render('mis-pedidos', {
            pedidos: [], clienteId: null, clienteNombre: null,
            error: 'Error al cargar los pedidos.'
        });
    }
};

// GET /portal/logout
export const logout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) console.error('Error destruyendo sesión:', err);
            res.redirect('/portal/login');
        });
    } else {
        res.redirect('/portal/login');
    }
};