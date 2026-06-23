const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        console.log('[DEBUG AUTH] authHeader recibido:', authHeader ? authHeader.substring(0, 30) + '...' : 'NO LLEGÓ');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[DEBUG AUTH] Falla: header ausente o formato inválido');
            return res.status(401).json({ mensaje: "Token requerido o formato inválido" });
        }

        const token = authHeader.split(' ')[1]?.trim();

        const secret = process.env.JWT_SECRET || '';
        const hash = crypto.createHash('sha256').update(secret).digest('hex');
        console.log('[DEBUG AUTH] JWT_SECRET está definido:', !!process.env.JWT_SECRET);
        console.log('[DEBUG AUTH] JWT_SECRET longitud:', secret.length);
        console.log('[DEBUG AUTH] JWT_SECRET HASH:', hash);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;

        console.log('[DEBUG AUTH] Verificación OK para usuario:', decoded.email, 'rol:', decoded.rol);

        return next();
    } catch (error) {
        console.error('[DEBUG AUTH] jwt.verify falló. Nombre del error:', error.name);
        console.error('[DEBUG AUTH] Mensaje del error:', error.message);
        return res.status(401).json({ mensaje: "Token inválido" });
    }
};

const verificarAdmin = (req, res, next) => {
    verificarToken(req, res, () => {
        if (!req.usuario || req.usuario.rol !== 'admin') {
            console.log('[DEBUG AUTH] Rol recibido:', req.usuario ? req.usuario.rol : 'sin usuario');
            return res.status(403).json({ mensaje: "No autorizado" });
        }
        return next();
    });
};

module.exports = {
    verificarToken,
    verificarAdmin
};