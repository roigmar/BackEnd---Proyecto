const Cliente = require('../models/cliente');

// Crear un nuevo cliente (Punto de Venta)
exports.crearCliente = async (req, res) => {
    try {
        const { nombre, tipo, configuracion_logistica, finanzas } = req.body;

        // Validaciones básicas
        if (!nombre || !tipo || !configuracion_logistica?.direccion_entrega) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios: nombre, tipo y dirección de entrega' });
        }

        const nuevoCliente = new Cliente({
            nombre,
            tipo,
            configuracion_logistica,
            finanzas
        });

        await nuevoCliente.save();
        res.status(201).json(nuevoCliente);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el cliente', error: error.message });
    }
};

// Obtener todos los clientes (Solo los activos por defecto)
exports.obtenerClientes = async (req, res) => {
    try {
        const { incluirInactivos } = req.query;
        const filtro = incluirInactivos === 'true' ? {} : { activo: true };

        const clientes = await Cliente.find(filtro);
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los clientes', error: error.message });
    }
};

// Obtener un cliente por ID
exports.obtenerClientePorId = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el cliente', error: error.message });
    }
};

// Actualizar un cliente
exports.actualizarCliente = async (req, res) => {
    try {
        const clienteActualizado = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!clienteActualizado) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        res.json(clienteActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el cliente', error: error.message });
    }
};

// Eliminar un cliente (BAJA LÓGICA)
exports.eliminarCliente = async (req, res) => {
    try {
        const clienteDesactivado = await Cliente.findByIdAndUpdate(
            req.params.id,
            { activo: false },
            { new: true }
        );

        if (!clienteDesactivado) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        res.json({ mensaje: 'Cliente desactivado correctamente', cliente: clienteDesactivado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al realizar la baja', error: error.message });
    }
};
