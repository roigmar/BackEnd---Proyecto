import Producto from '../models/producto.js';
import Pedido from '../models/pedido.js';

// GET /admin
export const mostrarAdmin = (req, res) => {
    res.render('admin');
};

// GET /admin/pedidos
export const mostrarPedidos = async (req, res) => {
    const { estado } = req.query;
    const filtro = estado ? { estado } : {};

    try {
        const pedidos = await Pedido.find(filtro)
            .populate('clienteId', 'nombre tipo configuracion_logistica.zona_reparto')
            .populate('detalles.productoId', 'nombre')
            .sort({ fecha: -1 })
            .lean();

        res.render('pedidos-admin', { pedidos, estadoFiltro: estado || '' });
    } catch (err) {
        console.error(err);
        res.status(500).render('pedidos-admin', {
            pedidos: [], estadoFiltro: '',
            error: 'Error al cargar los pedidos.'
        });
    }
};

// GET /admin/productos
export const catalogo = async (req, res) => {
    try {
        const productos = await Producto.find().lean();
        res.render('catalogo', { productos });
    } catch (err) {
        res.status(500).render('catalogo', { productos: [], error: 'Error al cargar productos.' });
    }
};

// GET /admin/productos/nuevo
export const formularioNuevo = (req, res) => {
    res.render('nuevo', { error: null });
};

// POST /admin/productos/nuevo
export const crearProductoVista = async (req, res) => {
    try {
        let { nombre, precio, descripcion, stock } = req.body;
        precio = parseFloat(precio);
        stock  = parseInt(stock, 10);

        if (!nombre || isNaN(precio) || !descripcion || isNaN(stock) || precio < 0 || stock < 0) {
            return res.render('nuevo', { error: 'Datos inválidos o incompletos.' });
        }

        const existe = await Producto.findOne({
            nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
        });
        if (existe) return res.render('nuevo', { error: 'El nombre del producto ya existe.' });

        await new Producto({ nombre, precio, descripcion, stock }).save();
        res.redirect('/admin/productos');

    } catch (err) {
        res.render('nuevo', { error: 'Error interno al guardar.' });
    }
};

// GET /admin/logout
export const logout = (req, res) => {
    res.redirect('/portal/login');
};