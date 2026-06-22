const app = require('./src/app');
const pool = require('./src/config/db'); // Importamos la configuración que acabamos de arreglar

const PORT = process.env.PORT || 10000; // Render usualmente usa 10000

app.listen(PORT, () => {
    console.log(`🚀 Server corriendo en puerto ${PORT}`);
});

// Ahora sí, probamos la conexión usando el pool configurado
pool.connect((err) => {
    if (err) {
        console.error('❌ Error conexión DB:', err.message);
    } else {
        console.log('✅ PostgreSQL conectado exitosamente');
    }
});