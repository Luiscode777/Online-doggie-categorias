const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ mensaje: "Token requerido o formato inválido" });
        }

        // El .trim() limpia cualquier espacio o salto de línea fantasma del test
        const token = authHeader.split(' ')[1]?.trim();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;

        return next(); // Aseguramos el retorno limpio
    } catch (error) {
        return res.status(401).json({ mensaje: "Token inválido" });
    }
};

// Modificado a flujo plano e independiente para evitar colisiones en tests concurrentes
const verificarAdmin = (req, res, next) => {
    // Primero ejecutamos la verificación de token de forma limpia
    verificarToken(req, res, () => {
        if (!req.usuario || req.usuario.rol !== 'admin') {
            return res.status(403).json({ mensaje: "No autorizado" });
        }
        return next();
    });
};

module.exports = {
    verificarToken,
    verificarAdmin
};