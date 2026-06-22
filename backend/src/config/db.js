const { Pool } = require('pg');
require('dotenv').config();

// Usamos la URL completa que nos da Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Necesario para la conexión segura con Render
    }
});

module.exports = pool;