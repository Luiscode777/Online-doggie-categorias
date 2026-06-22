require('dotenv').config();
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

module.exports = app;