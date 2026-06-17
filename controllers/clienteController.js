import Cliente from '../models/cliente.js';
import Usuario from '../models/usuario.js';
import crypto from 'crypto';

// Función para generar un nombre de usuario a partir del nombre del cliente
function generarUsuario(nombre) {
    return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

// Crear un nuevo cliente (Punto de Venta)
export const crearCliente = async (req, res) => {
    try {
        const { nombre, tipo, configuracion_logistica, finanzas } = req.body;

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

        // Generar usuario automáticamente
        let usuarioGenerado = generarUsuario(nombre);

        // Evitar duplicados
        let contador = 1;
        let usuarioDisponible = usuarioGenerado;

        while (await Usuario.findOne({ usuario: usuarioDisponible })) {
        usuarioDisponible = `${usuarioGenerado}.${contador}`;
        contador++;
        }

        usuarioGenerado = usuarioDisponible;

        // Generar contraseña temporal      
        const passwordTemporal = crypto
        .randomBytes(6)
        .toString('base64')
        .replace(/[+/=]/g, '');

        // Crear usuario asociado
        await Usuario.create({
        usuario: usuarioGenerado,
        password: passwordTemporal,
        rol: 'CLIENTE',
        clienteId: nuevoCliente._id,
        debeCambiarPassword: true
        });

        const isHtmlForm =
        req.is('application/x-www-form-urlencoded') ||
        (req.headers.accept && req.headers.accept.includes('text/html'));

        if (isHtmlForm) {
        return res.render('cliente-creado', {
        cliente: nuevoCliente,
        usuario: usuarioGenerado,
        passwordTemporal
    });
}

res.status(201).json({
    cliente: nuevoCliente,
    usuario: usuarioGenerado,
    passwordTemporal
});
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el cliente', error: error.message });
    }
};

// Obtener todos los clientes (Solo los activos por defecto)
export const obtenerClientes = async (req, res) => {
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
export const obtenerClientePorId = async (req, res) => {
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
export const actualizarCliente = async (req, res) => {
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
export const eliminarCliente = async (req, res) => {
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