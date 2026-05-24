import Producto from '../models/producto.js';
import Pedido from '../models/pedido.js';

/* CREATE */
async function crearProducto(req, res) {
    try {
        const { nombre, precio, descripcion, stock } = req.body;

        if (!nombre || precio === undefined || !descripcion || stock === undefined) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (typeof precio !== 'number' || typeof stock !== 'number' || stock < 0) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const existe = await Producto.findOne({
            nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
            /* Uso de expresión regular para búsqueda, ^ → inicio del string $ → fin del string, i → insensible a mayúsculas y minúsculas */
        });

        if (existe) {
            return res.status(400).json({ error: 'El nombre del producto ya existe' });
        }

        const nuevoProducto = new Producto({ nombre, precio, descripcion, stock });
        await nuevoProducto.save(); /*El id es generado automáticamente por MongoDB al guardar el producto*/

        res.status(201).json(nuevoProducto);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* READ */
async function obtenerProductos(req, res) {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

async function obtenerProductoPorId(req, res) {
    try {
        const producto = await Producto.findById(req.params.id);

        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* UPDATE */
async function actualizarProducto(req, res) {
    try {
        const { nombre, precio, descripcion, stock } = req.body;

        if (precio !== undefined && (typeof precio !== 'number' || precio < 0)) {
            return res.status(400).json({ error: 'Precio inválido' });
        }

        if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
            return res.status(400).json({ error: 'Stock inválido' });
        }

        if (nombre !== undefined) {
            const existe = await Producto.findOne({
                _id: { $ne: req.params.id },
                nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
            });
            if (existe) {
                return res.status(400).json({ error: 'El nombre del producto ya existe' });
            }
        }

        const campos = {};
        if (nombre !== undefined)      campos.nombre = nombre;
        if (precio !== undefined)      campos.precio = precio;
        if (descripcion !== undefined) campos.descripcion = descripcion;
        if (stock !== undefined)       campos.stock = stock;

        const producto = await Producto.findByIdAndUpdate(
            req.params.id,
            { $set: campos },
            { new: true, runValidators: true }
        );

        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json(producto);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* DELETE */
async function eliminarProducto(req, res) {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        const pedidoPendiente = await Pedido.findOne({
            estado: 'pendiente',
            'detalles.productoId': producto._id
        });

        if (pedidoPendiente) {
            return res.status(400).json({ error: 'No se puede eliminar el producto porque está asociado a un pedido pendiente' });
        }

        await Producto.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado correctamente' });

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* VISTAS */
async function obtenerProductosVista(req, res) {
    try {
        const productos = await Producto.find();
        res.render('catalogo', { productos });
    } catch (error) {
        res.status(500).send('Error interno del servidor');
    }
}

function formularioNuevoProducto(req, res) {
    res.render('nuevo');
}

async function crearProductoVista(req, res) {
    try {
        let { nombre, precio, descripcion, stock } = req.body;

        precio = parseFloat(precio);
        stock = parseInt(stock, 10);

        if (!nombre || isNaN(precio) || !descripcion || isNaN(stock)) {
            return res.status(400).send('Faltan campos obligatorios o son inválidos');
        }

        if (precio < 0 || stock < 0) {
            return res.status(400).send('Datos inválidos');
        }

        const existe = await Producto.findOne({
            nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') }
        });

        if (existe) return res.status(400).send('El nombre del producto ya existe');

        const nuevoProducto = new Producto({ nombre, precio, descripcion, stock });
        await nuevoProducto.save();

        res.redirect('/productos/vista');

    } catch (error) {
        res.status(500).send('Error interno del servidor');
    }
}

export {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto,
    obtenerProductosVista,
    formularioNuevoProducto,
    crearProductoVista
};