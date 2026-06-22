require('dotenv').config();
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

module.exports = app;