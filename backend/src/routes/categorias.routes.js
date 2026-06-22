const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 

// 🛑 IMPORTANTE: Asegúrate de importar tus middlewares de autenticación correctos aquí.
// Ejemplo común en tu proyecto:
// const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
// Si no los tienes separados, déjalos listos o usa los que ya tengas validados en productos.routes.js.


// 1. OBTENER TODAS LAS CATEGORÍAS (Público - Para el catálogo y formularios)
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC'); // Cambiado a ASC para que salgan ordenadas alfabéticamente
        res.json(resultado.rows);
    } catch (error) {
        console.error("Error al traer categorías:", error);
        res.status(500).json({ error: "Error en el servidor al traer categorías" });
    }
});


// 2. CREAR NUEVA CATEGORÍA (Privado - Añadir middlewares aquí cuando estén listos)
// Ejemplo: router.post('/', verificarToken, esAdmin, async (req, res) => {
router.post('/', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({ error: "El nombre de la categoría es requerido" });
    }

    try {
        // Validar si ya existe ignorando mayúsculas/minúsculas (Requisito estricto)
        const existe = await pool.query('SELECT * FROM categorias WHERE LOWER(nombre) = LOWER($1)', [nombre.trim()]);
        if (existe.rows.length > 0) {
            return res.status(400).json({ error: "Esta categoría ya existe en el sistema" });
        }

        // Si no existe, se inserta limpiamente
        const nuevo = await pool.query('INSERT INTO categorias (nombre) VALUES ($1) RETURNING *', [nombre.trim()]);
        res.status(201).json(nuevo.rows[0]);
    } catch (error) {
        console.error("Error al guardar categoría:", error);
        res.status(500).json({ error: "Error interno al guardar la categoría" });
    }
});


// 3. ELIMINAR CATEGORÍA (Privado - Añadir middlewares aquí cuando estén listos)
// Ejemplo: router.delete('/:id', verificarToken, esAdmin, async (req, res) => {
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // REGLA DE NEGOCIO: Validar primero si hay productos usando esta categoría en PostgreSQL
        // Cambia 'productos' y 'categoria_id' si en tu base de datos se llaman diferente
        const productosAsociados = await pool.query('SELECT COUNT(*) FROM productos WHERE categoria_id = $1', [id]);
        const cantidad = parseInt(productosAsociados.rows[0].count);

        if (cantidad > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar la categoría. Tiene ${cantidad} producto(s) asignado(s) en el catálogo.` 
            });
        }

        // Si está libre de productos, se procede al borrado seguro
        const resultadoBorrado = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING *', [id]);
        
        if (resultadoBorrado.rowCount === 0) {
            return res.status(404).json({ error: "La categoría especificada no existe" });
        }

        res.json({ mensaje: "Categoría eliminada con éxito" });
    } catch (error) {
        console.error("Error al eliminar categoría en la BD:", error);
        res.status(500).json({ error: "Fallo interno en el servidor al intentar procesar la eliminación" });
    }
});

module.exports = router;