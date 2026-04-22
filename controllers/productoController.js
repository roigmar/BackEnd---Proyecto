const fs = require('fs');
const path = require('path');
const Producto = require('../models/producto');

// Rutas a los archivos JSON para almacenar los datos de productos y pedidos
const productosPath = path.join(__dirname, '../data/productos.json');
const pedidosPath = path.join(__dirname, '../data/pedidos.json');

/* CREATE */
function crearProducto(req, res) {
    try {
        const { nombre, precio, descripcion, stock } = req.body;

        if (!nombre || precio === undefined || !descripcion || stock === undefined) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (typeof precio !== 'number' || typeof stock !== 'number' || stock < 0) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        const productos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));

        const existe = productos.some(
            p => p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
        );

        if (existe) {
            return res.status(400).json({ error: 'El nombre del producto ya existe' });
        }

        const nuevoId = productos.length > 0
            ? Math.max(...productos.map(p => p.id)) + 1
            : 1;

        const nuevoProducto = new Producto(nuevoId, nombre, precio, descripcion, stock);

        productos.push(nuevoProducto);

        fs.writeFileSync(productosPath, JSON.stringify(productos, null, 2));

        res.status(201).json(nuevoProducto);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
/* READ */
function obtenerProductos(req, res) {
    try {
        const productos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

function obtenerProductoPorId(req, res) {
    try {
        const id = Number(req.params.id);
        const productos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));
        const producto = productos.find(p => p.id === id);
        
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}


/* UPDATE */
function actualizarProducto(req, res) {
    try {
        const id = Number(req.params.id);
        const { nombre, precio, descripcion, stock } = req.body;

        const productos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));

        const productoIndex = productos.findIndex(p => p.id === id);
        if (productoIndex === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = productos[productoIndex];

        // Validaciones solo si vienen los campos
        if (precio !== undefined && (typeof precio !== 'number' || precio < 0)) {
            return res.status(400).json({ error: 'Precio inválido' });
        }

        if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
            return res.status(400).json({ error: 'Stock inválido' });
        }

        if (nombre !== undefined) {
            const existe = productos.some(
                p => p.id !== id &&
                p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
            );
            if (existe) {
                return res.status(400).json({ error: 'El nombre del producto ya existe' });
            }
            producto.nombre = nombre;
        }

        if (precio !== undefined) producto.precio = precio;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (stock !== undefined) producto.stock = stock;

        fs.writeFileSync(productosPath, JSON.stringify(productos, null, 2));

        res.json(producto);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* DELETE - Con Interacción entre Módulos, verifica  que un producto no esté pendiente en un pedido */
function eliminarProducto(req, res) {
    try {
        const id = Number(req.params.id);
        
        
        const productos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));
        const productoIndex = productos.findIndex(p => p.id === id);
        if (productoIndex === -1) return res.status(404).json({ error: 'Producto no encontrado' });

        
        const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));
        
        
       // 2. Verificar si el producto está asociado a algún pedido pendiente
        if (pedidos.some(pedido => 
            pedido.estado === 'pendiente' &&
            pedido.detalles.some(detalle => detalle.productoId === id)
        )) {
            return res.status(400).json({ error: 'No se puede eliminar el producto porque está asociado a un pedido pendiente' });
        }

        // 3. Si no tiene dependencias, procedemos a borrar
        productos.splice(productoIndex, 1);
        fs.writeFileSync(productosPath, JSON.stringify(productos, null, 2));
        
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    actualizarProducto,
    eliminarProducto
};