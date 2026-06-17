import Usuario from '../models/usuario.js';

export const crearUsuario = async (req, res) => {
    try {
        const { usuario, password, rol = 'CLIENTE', clienteId } = req.body;

        if (!usuario || !password) {
            if (req.is('application/x-www-form-urlencoded')) return res.render('usuario', { error: 'Faltan campos obligatorios', clientes: [] });
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Verificar unicidad
        const existe = await Usuario.findOne({ usuario: usuario.trim().toLowerCase() });
        if (existe) {
            if (req.is('application/x-www-form-urlencoded')) return res.render('usuario', { error: 'El nombre de usuario ya existe', clientes: [] });
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }

        const nuevo = new Usuario({
            usuario: usuario.trim().toLowerCase(),
            password,
            rol: (rol || 'CLIENTE')
        });

        if (clienteId) nuevo.clienteId = clienteId;

        await nuevo.save();

        const isHtmlForm = req.is('application/x-www-form-urlencoded') || (req.headers.accept && req.headers.accept.includes('text/html'));
        if (isHtmlForm) {
            const referer = req.headers.referer || '';
            if (referer.includes('/admin')) return res.redirect('/admin?msg=usuario_creado');
            return res.redirect('/portal/login?msg=usuario_creado');
        }

        const resp = nuevo.toObject();
        delete resp.password;
        res.status(201).json(resp);
    } catch (err) {
        console.error('Error crear usuario:', err);
        if (req.is('application/x-www-form-urlencoded')) return res.render('usuario', { error: 'Error interno al crear usuario', clientes: [] });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export default { crearUsuario };
