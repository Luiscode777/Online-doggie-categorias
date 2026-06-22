const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // --- LOG TEMPORAL 1: ¿llega el header? ---
        console.log('[DEBUG AUTH] authHeader recibido:', authHeader ? authHeader.substring(0, 30) + '...' : 'NO LLEGÓ');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[DEBUG AUTH] Falla: header ausente o formato inválido');
            return res.status(401).json({ mensaje: "Token requerido o formato inválido" });
        }

        const token = authHeader.split(' ')[1]?.trim();

        // --- LOG TEMPORAL 2: ¿existe JWT_SECRET en este proceso? ---
        console.log('[DEBUG AUTH] JWT_SECRET está definido:', !!process.env.JWT_SECRET);
        console.log('[DEBUG AUTH] JWT_SECRET longitud:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;

        console.log('[DEBUG AUTH] Verificación OK para usuario:', decoded.email, 'rol:', decoded.rol);

        return next();
    } catch (error) {
        // --- LOG TEMPORAL 3: el motivo EXACTO del fallo ---
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