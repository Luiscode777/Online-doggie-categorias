require('dotenv').config();
const PROCESS_ID = Math.random().toString(36).substring(2, 10) + '-' + Date.now();
console.log('[DEBUG AUTH] Proceso arrancado con ID:', PROCESS_ID);
const { createToken } = require('./utils/security');
const jwt = require('jsonwebtoken');
const adminRoutes = require('./routes/admin.routes');
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const categoriasRoutes = require('./routes/categorias.routes');


const app = express();


app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => {
    res.send('API ONLINE DOGGIE funcionando 🐶');
});

// === RUTA TEMPORAL DE DIAGNÓSTICO — BORRAR DESPUÉS ===
app.get('/api/debug-secret', (req, res) => {
    const secret = process.env.JWT_SECRET || '';
    res.json({
        processId: PROCESS_ID,
        existe: !!process.env.JWT_SECRET,
        longitud: secret.length,
        primeros3: secret.substring(0, 3),
        ultimos3: secret.substring(secret.length - 3),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/debug-roundtrip', (req, res) => {
    try {
        const secretAlFirmar = process.env.JWT_SECRET;
        const tokenDePrueba = createToken({ id: '999', email: 'test@test.com', nombre: 'Test', rol: 'admin' });
        const secretAlVerificar = process.env.JWT_SECRET;

        let resultadoVerify;
        try {
            const decoded = jwt.verify(tokenDePrueba, process.env.JWT_SECRET);
            resultadoVerify = { ok: true, decoded };
        } catch (e) {
            resultadoVerify = { ok: false, error: e.name, mensaje: e.message };
        }

        res.json({
            secretAlFirmar_longitud: secretAlFirmar.length,
            secretAlVerificar_longitud: secretAlVerificar.length,
            secretsIguales: secretAlFirmar === secretAlVerificar,
            tokenGenerado: tokenDePrueba,
            resultadoVerify
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// AGREGAR a src/app.js, junto a las otras rutas debug

app.get('/api/debug-verify-real', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.json({ error: 'No llegó header Authorization' });
        }

        const token = authHeader.split(' ')[1]?.trim();

        res.json({
            processId: PROCESS_ID,
            headerCompleto_longitud: authHeader.length,
            tokenExtraido_longitud: token ? token.length : 0,
            tokenExtraido_primeros20: token ? token.substring(0, 20) : null,
            tokenExtraido_ultimos20: token ? token.substring(token.length - 20) : null,
            secretEnEsteMomento_longitud: process.env.JWT_SECRET.length,
            resultado: (() => {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    return { ok: true, decoded };
                } catch (e) {
                    return { ok: false, error: e.name, mensaje: e.message };
                }
            })()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === NUEVO: replica el login real contra la DB y verifica en la misma petición ===
app.get('/api/debug-login-roundtrip', async (req, res) => {
    try {
        const pool = require('./config/db');

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            ['Admin@gmail.com']
        );

        if (!result.rows.length) {
            return res.json({ error: 'usuario no encontrado' });
        }

        const usuario = result.rows[0];

        // Mostramos los tipos de dato reales que vienen de la DB
        const tipos = {};
        for (const key of ['id', 'email', 'nombre', 'rol']) {
            tipos[key] = { valor: usuario[key], tipo: typeof usuario[key] };
        }

        const token = createToken({
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
        });

        let resultadoVerify;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            resultadoVerify = { ok: true, decoded };
        } catch (e) {
            resultadoVerify = { ok: false, error: e.name, mensaje: e.message };
        }

        res.json({
            tiposDeDatos: tipos,
            tokenGenerado: token,
            resultadoVerify
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// === NUEVO: ruta protegida por el middleware REAL, para aislar si el bug vive ahí ===
const { verificarAdmin } = require('./middlewares/auth.middleware');
app.get('/api/debug-middleware-real', verificarAdmin, (req, res) => {
    res.json({
        processId: PROCESS_ID,
        ok: true,
        usuario: req.usuario
    });
});

module.exports = app;