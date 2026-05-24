import Pedido from '../models/pedido.js';
import Cliente from '../models/cliente.js';
import Producto from '../models/producto.js';

/* CREATE */
async function crearPedido(req, res) {
    try {
        const { clienteId, detalles } = req.body;

        if (!clienteId || !detalles) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        if (!Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ error: 'El pedido debe incluir al menos un detalle' });
        }

        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        if (!cliente.activo) {
            return res.status(400).json({ error: 'El cliente está inactivo' });
        }

        const detallesProcesados = [];
        let total = 0;

        for (const detalle of detalles) {
            const { productoId, cantidad } = detalle;

            if (!productoId || cantidad === undefined) {
                return res.status(400).json({ error: 'Cada detalle debe incluir productoId y cantidad' });
            }

            const cantidadNumero = Number(cantidad);

            if (isNaN(cantidadNumero) || cantidadNumero <= 0) {
                return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
            }

            const producto = await Producto.findById(productoId);

            if (!producto) {
                return res.status(404).json({ error: `Producto con id ${productoId} no encontrado` });
            }

            if (producto.stock < cantidadNumero) {
                return res.status(400).json({
                    error: `Stock insuficiente para el producto "${producto.nombre}"`
                });
            }

            const subtotal = producto.precio * cantidadNumero;

            detallesProcesados.push({
                productoId: producto._id,
                cantidad: cantidadNumero,
                precioUnitario: producto.precio,
                subtotal
            });

            total += subtotal;
        }

        const nuevoPedido = new Pedido({
            clienteId: cliente._id,
            detalles: detallesProcesados,
            total,
            estado: 'pendiente'
        });

        await nuevoPedido.save();

        for (const detalle of detallesProcesados) {
            await Producto.findByIdAndUpdate(detalle.productoId, {
                $inc: { stock: -detalle.cantidad }
            });
        }

        const pedidoCreado = await Pedido.findById(nuevoPedido._id)
            .populate('clienteId', 'nombre tipo')
            .populate('detalles.productoId', 'nombre');

        if (req.accepts('html')) {
            return res.render('pedido-confirmacion', { pedido: pedidoCreado });
        }
        res.status(201).json(pedidoCreado);

    } catch (error) {
        if (req.accepts('html')) {
            return res.status(500).render('pedido-confirmacion', {
                pedido: null,
                error: 'Error interno al guardar el pedido.'
            });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* READ */
async function obtenerPedidos(req, res) {
    try {
        const pedidos = await Pedido.find()
            .populate('clienteId', 'nombre tipo configuracion_logistica.zona_reparto')
            .populate('detalles.productoId', 'nombre precio')
            .sort({ fecha: -1 });

        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

async function obtenerPedidoPorId(req, res) {
    try {
        const pedido = await Pedido.findById(req.params.id)
            .populate('clienteId', 'nombre tipo configuracion_logistica.zona_reparto')
            .populate('detalles.productoId', 'nombre precio');

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

/* UPDATE ESTADO */
async function actualizarEstadoPedido(req, res) {
    try {
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({ error: 'Falta el campo estado' });
        }

        const pedido = await Pedido.findById(req.params.id);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const transicionesValidas = {
            'pendiente': 'en producción',
            'en producción': 'despachado',
            'despachado': 'entregado',
            'entregado': null
        };

        const siguienteEstado = transicionesValidas[pedido.estado];

        if (!siguienteEstado) {
            return res.status(400).json({ error: 'El pedido ya fue entregado y no puede cambiar de estado' });
        }

        if (estado !== siguienteEstado) {
            return res.status(400).json({
                error: `Transición inválida. Solo se permite pasar de "${pedido.estado}" a "${siguienteEstado}"`
            });
        }

        pedido.estado = estado;
        await pedido.save();

        const pedidoActualizado = await Pedido.findById(pedido._id)
            .populate('clienteId', 'nombre tipo')
            .populate('detalles.productoId', 'nombre');

        res.json(pedidoActualizado);

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export {
    crearPedido,
    obtenerPedidos,
    obtenerPedidoPorId,
    actualizarEstadoPedido
};