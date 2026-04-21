const fs = require('fs');
const path = require('path');
const Pedido = require('../models/pedido');
const DetallePedido = require('../models/detallePedido');

const pedidosPath = path.join(__dirname, '../data/pedidos.json');
const productosPath = path.join(__dirname, '../data/productos.json');

/* CREATE */
function crearPedido(req, res) {
    try {
        const { cliente, tipoCliente, detalles } = req.body;

        // tipoCliente debe ser "Sucursal" o "Franquicia"
        if (!cliente || !tipoCliente || !detalles) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (tipoCliente !== 'Sucursal' && tipoCliente !== 'Franquicia') {
            return res.status(400).json({ error: 'tipoCliente debe ser "Sucursal" o "Franquicia"' });
        }

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ error: 'El pedido debe incluir al menos un detalle' });
        }

        const productos = JSON.parse(fs.readFileSync(productosPath, 'utf-8'));
        const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));

        const detallesProcesados = [];

        for (const detalle of detalles) {
            const { productoId, cantidad } = detalle;

            if (productoId === undefined || cantidad === undefined) {
                return res.status(400).json({ error: 'Cada detalle debe incluir productoId y cantidad' });
            }

            if (typeof cantidad !== 'number' || cantidad <= 0) {
                return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
            }

            const producto = productos.find(p => p.id === Number(productoId));

            if (!producto) {
                return res.status(404).json({ error: `Producto con id ${productoId} no encontrado` });
            }

            const nuevoDetalle = new DetallePedido(
                producto.id,
                producto.nombre,
                cantidad,
                producto.precio
            );

            detallesProcesados.push(nuevoDetalle);
        }

        const nuevoId = pedidos.length > 0
            ? Math.max(...pedidos.map(p => p.id)) + 1
            : 1;

        const nuevoPedido = new Pedido(nuevoId, cliente, detallesProcesados);
        nuevoPedido.tipoCliente = tipoCliente;

        pedidos.push(nuevoPedido);

        fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));

        res.status(201).json(nuevoPedido);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* READ */
function obtenerPedidos(req, res) {
    try {
        const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

function obtenerPedidoPorId(req, res) {
    try {
        const id = Number(req.params.id);
        const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));
        const pedido = pedidos.find(p => p.id === id);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* UPDATE ESTADO */
function actualizarEstadoPedido(req, res) {
    try {
        const id = Number(req.params.id);
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({ error: 'Falta el campo estado' });
        }

        const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));
        const pedidoIndex = pedidos.findIndex(p => p.id === id);

        if (pedidoIndex === -1) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const estadoActual = pedidos[pedidoIndex].estado;

        const transicionesValidas = {
            'pendiente': 'en producción',
            'en producción': 'despachado',
            'despachado': 'entregado',
            'entregado': null
        };

        const siguienteEstado = transicionesValidas[estadoActual];

        if (!siguienteEstado) {
            return res.status(400).json({ error: 'El pedido ya fue entregado y no puede cambiar de estado' });
        }

        if (estado !== siguienteEstado) {
            return res.status(400).json({
                error: `Transición inválida. Solo se permite pasar de "${estadoActual}" a "${siguienteEstado}"`
            });
        }

        pedidos[pedidoIndex].estado = estado;

        fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));

        res.json(pedidos[pedidoIndex]);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    crearPedido,
    obtenerPedidos,
    obtenerPedidoPorId,
    actualizarEstadoPedido
};