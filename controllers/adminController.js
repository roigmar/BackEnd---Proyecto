import Producto from '../models/producto.js';
import Pedido from '../models/pedido.js';
import Cliente from '../models/cliente.js';

// GET /admin
export const mostrarAdmin = (req, res) => {
    res.render('admin');
};

// GET /admin/pedidos
export const mostrarPedidos = async (req, res) => {
    const { estado, cliente } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (cliente) filtro.clienteId = cliente;

    try {
        const pedidos = await Pedido.find(filtro)
            .populate('clienteId', 'nombre tipo configuracion_logistica.zona_reparto')
            .populate('detalles.productoId', 'nombre')
            .sort({ fecha: -1 })
            .lean();

        // obtener lista de clientes para el select de filtro
        const clientes = await Cliente.find().select('_id nombre').lean();

        res.render('pedidos-admin', { pedidos, estadoFiltro: estado || '', clientes, clienteFiltro: cliente || '' });
    } catch (err) {
        console.error(err);
        res.status(500).render('pedidos-admin', {
            pedidos: [], estadoFiltro: '', clientes: [], clienteFiltro: '',
            error: 'Error al cargar los pedidos.'
        });
    }
};

// GET /admin/productos
export const catalogo = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const msg = req.query.msg || '';
        let filtro = {};
        if (q) {
            filtro = { nombre: { $regex: q, $options: 'i' } };
        }

        const productos = await Producto.find(filtro).lean();
        res.render('catalogo', { productos, q, msg });
    } catch (err) {
        res.status(500).render('catalogo', { productos: [], error: 'Error al cargar productos.', q: '', msg: '' });
    }
};

// GET /admin/productos/nuevo
export const formularioNuevo = (req, res) => {
    res.render('nuevo', { error: null });
};

// GET /admin/clientes/nuevo
export const formularioNuevoCliente = (req, res) => {
    res.render('cliente', { error: null });
};

// GET /admin/usuarios/nuevo
export const formularioNuevoUsuario = async (req, res) => {
    try {
        // traer lista de clientes para asociar al usuario
        const clientes = await Cliente.find({ activo: true }).select('_id nombre').lean();
        const clienteId = req.query.clienteId || '';
        res.render('usuario', { error: null, clientes, clienteId });
    } catch (err) {
        console.error(err);
        res.render('usuario', { error: 'Error al cargar datos de clientes.', clientes: [], clienteId: '' });
    }
};

// GET /admin/productos/:id/editar
export const formularioEditar = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).lean();
        if (!producto) return res.render('nuevo', { error: 'Producto no encontrado.', producto: null });
        res.render('nuevo', { error: null, producto });
    } catch (err) {
        res.render('nuevo', { error: 'Error al cargar el producto.', producto: null });
    }
};

// POST /admin/productos/:id/editar
export const actualizarProductoVista = async (req, res) => {
    try {
        const { nombre, precio, descripcion, stock } = req.body;
        const parsedPrecio = parseFloat(precio);
        const parsedStock = parseInt(stock, 10);

        if (!nombre || isNaN(parsedPrecio) || !descripcion || isNaN(parsedStock) || parsedPrecio < 0 || parsedStock < 0) {
            return res.render('nuevo', { error: 'Datos inválidos o incompletos.', producto: { _id: req.params.id, nombre, precio, descripcion, stock } });
        }

        const existe = await Producto.findOne({
            _id: { $ne: req.params.id },
            nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
        });
        if (existe) return res.render('nuevo', { error: 'El nombre del producto ya existe.', producto: { _id: req.params.id, nombre, precio: parsedPrecio, descripcion, stock: parsedStock } });

        await Producto.findByIdAndUpdate(req.params.id, {
            nombre: nombre.trim(),
            precio: parsedPrecio,
            descripcion,
            stock: parsedStock
        }, { runValidators: true });

        res.redirect('/admin/productos?msg=actualizado');
    } catch (err) {
        res.render('nuevo', { error: 'Error interno al actualizar.', producto: { _id: req.params.id } });
    }
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
        res.redirect('/admin/productos?msg=creado');

    } catch (err) {
        res.render('nuevo', { error: 'Error interno al guardar.' });
    }
};

// GET /admin/logout
export const logout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) console.error('Error destruyendo sesión admin:', err);
            res.redirect('/portal/login');
        });
    } else {
        res.redirect('/portal/login');
    }
};