export const requiereCliente = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/portal/login');
    }
    if (req.session.usuario.rol !== 'CLIENTE') {
        if (req.session.usuario.rol === 'ADMIN') {
            return res.redirect('/admin');
        }
        return res.status(403).send('Acceso denegado. Se requiere rol CLIENTE.');
    }
    next();
};

export const requiereAdmin = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/portal/login');
    }
    if (req.session.usuario.rol !== 'ADMIN') {
        if (req.session.usuario.rol === 'CLIENTE') {
            return res.redirect('/portal');
        }
        return res.status(403).send('Acceso denegado. Se requiere rol ADMIN.');
    }
    next();
};
