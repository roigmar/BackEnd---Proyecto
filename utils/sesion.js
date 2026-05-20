const crypto = require('crypto');

// ── Almacén compartido de sesiones en memoria ──
const sesiones = new Map();

const SESSION_COOKIE  = 'portal_sid';
const SESSION_MAX_AGE = 1000 * 60 * 60 * 4; // 4 horas en ms

function generarToken() {
    return crypto.randomBytes(32).toString('hex');
}

function obtenerToken(req) {
    const raw = req.headers.cookie || '';
    const entrada = raw.split(';').map(c => c.trim())
        .find(c => c.startsWith(`${SESSION_COOKIE}=`));
    return entrada ? entrada.split('=')[1] : null;
}

function obtenerSesion(req) {
    const token = obtenerToken(req);
    if (!token) return null;
    const sesion = sesiones.get(token);
    if (!sesion) return null;
    if (Date.now() > sesion.expira) { sesiones.delete(token); return null; }
    return sesion.datos;
}

function crearSesion(res, datos) {
    const token = generarToken();
    sesiones.set(token, { datos, expira: Date.now() + SESSION_MAX_AGE });
    res.setHeader('Set-Cookie',
        `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE / 1000}`
    );
}

function destruirSesion(req, res) {
    const token = obtenerToken(req);
    if (token) sesiones.delete(token);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
}

module.exports = { SESSION_COOKIE, SESSION_MAX_AGE, obtenerSesion, crearSesion, destruirSesion };
