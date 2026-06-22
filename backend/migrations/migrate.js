// Carga las variables de entorno buscando el archivo .env una carpeta atrás
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = require('pg');
const fs = require('fs');

// variables del .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function asegurarTablaMigraciones(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migraciones_ejecutadas (
      id SERIAL PRIMARY KEY,
      nombre_archivo VARCHAR(255) UNIQUE NOT NULL,
      ejecutado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function ejecutarMigraciones() {
  let client;
  try {
    console.log('🔄 Conectando a la base de datos de Online_Doggie...');
    client = await pool.connect();
    
    console.log('🔄 Iniciando proceso de migraciones...');
    await asegurarTablaMigraciones(client);

    // Leer todos los archivos .sql de la carpeta
    const archivos = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Obtener las que ya se corrieron antes
    const { rows } = await client.query('SELECT nombre_archivo FROM _migraciones_ejecutadas');
    const yaEjecutadas = rows.map(r => r.nombre_archivo);

    for (const archivo of archivos) {
      if (yaEjecutadas.includes(archivo)) {
        console.log(`⏩ Saltando: ${archivo} (Ya fue ejecutado)`);
        continue;
      }

      console.log(`🚀 Ejecutando: ${archivo}...`);
      const rutaCompleta = path.join(__dirname, archivo);
      const contenidoSql = fs.readFileSync(rutaCompleta, 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(contenidoSql);
        await client.query('INSERT INTO _migraciones_ejecutadas (nombre_archivo) VALUES ($1)', [archivo]);
        await client.query('COMMIT');
        console.log(`✅ Éxito: ${archivo}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.log(`❌ Error en ${archivo}. Se aplicó Rollback.`);
        throw err;
      }
    }

    console.log('🎉 ¡Todas las tablas están creadas y actualizadas en pgAdmin!');
  } catch (error) {
    console.error('💥 Error crítico durante las migraciones:', error.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

ejecutarMigraciones();