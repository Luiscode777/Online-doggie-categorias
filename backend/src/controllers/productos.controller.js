const pool = require('../config/db');
const multer = require('multer');
const path = require('path');

/* CONFIGURACIÓN MULTER */
const fs = require('fs'); // Asegúrate de importar fs arriba

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = process.env.NODE_ENV === 'test'
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: function (req, file, cb) {
            // APUNTAR A LA CARPETA uploads EN EL BACKEND
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const nombreUnico = Date.now() + '-' + file.originalname;
            cb(null, nombreUnico);
        }
    });

exports.upload = multer({ storage });


/* OBTENER PRODUCTOS */
exports.obtenerProductos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                productos.*,
                categorias.nombre AS categoria
            FROM productos
            JOIN categorias
                ON productos.categoria_id = categorias.id
        `);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/* CREAR PRODUCTO */
exports.crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria, stock } = req.body;

        // 1. Validar presencia
        if (!nombre || !descripcion || !precio || !categoria || !stock) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // 2. FORZAR CONVERSIÓN A NÚMERO AQUÍ TAMBIÉN
        const precioNum = parseInt(precio, 10);
        const stockNum = parseInt(stock, 10);
        const catNum = parseInt(categoria, 10);

        // 3. Validar que la conversión fue exitosa
        if (isNaN(precioNum) || isNaN(stockNum) || isNaN(catNum)) {
            return res.status(400).json({ error: "El precio, stock y categoría deben ser números válidos" });
        }

        const imagen = req.file ? req.file.filename : null;

        await pool.query(`
            INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock, imagen)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [nombre, descripcion, precioNum, catNum, stockNum, imagen]);

        res.json({ mensaje: "Producto creado" });
    } catch (error) {

        if (process.env.NODE_ENV !== 'test') {
            console.error("Error en crearProducto:", error);
        }

        res.status(500).json({
            error: error.message
        });
    }
};


/* ACTUALIZAR PRODUCTO */
exports.actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, categoria, stock } = req.body;

        if (!nombre || !descripcion || !precio || !categoria || !stock) {
            return res.status(400).json({ error: "No se permiten campos vacíos" });
        }

        const imagen = req.file ? (req.file.filename || req.file.originalname) : null;
        let result;

        if (imagen) {
            result = await pool.query(`
                UPDATE productos 
                SET nombre=$1, descripcion=$2, precio=$3, categoria_id=$4, stock=$5, imagen=$6
                WHERE id=$7
            `, [nombre, descripcion, precio, parseInt(categoria), stock, imagen, id]);
        } else {
            result = await pool.query(`
                UPDATE productos 
                SET nombre=$1, descripcion=$2, precio=$3, categoria_id=$4, stock=$5
                WHERE id=$6
            `, [nombre, descripcion, precio, parseInt(categoria), stock, id]);
        }

        // VALIDACIÓN QA: Si no afectó filas, el producto no existe
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({ mensaje: "Producto actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/* ELIMINAR PRODUCTO */
exports.eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM productos WHERE id = $1",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }

        res.json({
            mensaje: "Producto eliminado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

/* STOCK BAJO */
exports.stockBajo = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nombre, stock FROM productos WHERE stock <= 5"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/* ACTUALIZAR STOCK */
exports.actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock === null) {
            return res.status(400).json({ error: "El stock es obligatorio" });
        }

        const result = await pool.query(`
            UPDATE productos 
            SET stock=$1
            WHERE id=$2
        `, [stock, id]);

        // VALIDACIÓN QA: Si no afectó filas, el producto no existe
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.json({
            mensaje: "Stock actualizado correctamente",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/* VALORAR PRODUCTO */
exports.valorarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { valoracion } = req.body;
        const usuario_id = req.usuario.id;

        if (!valoracion || valoracion < 1 || valoracion > 5) {
            return res.status(400).json({ error: "La valoración debe ser entre 1 y 5" });
        }


        const existeProducto = await pool.query("SELECT id FROM productos WHERE id = $1", [id]);
        if (existeProducto.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const yaValoro = await pool.query(
            "SELECT id FROM valoraciones WHERE producto_id=$1 AND usuario_id=$2",
            [id, usuario_id]
        );

        if (yaValoro.rows.length > 0) {
            return res.status(400).json({ error: "Ya valoraste este producto" });
        }

        await pool.query(`
            INSERT INTO valoraciones (producto_id, usuario_id, valoracion)
            VALUES ($1, $2, $3)
        `, [id, usuario_id, valoracion]);

        res.json({ mensaje: "Valoración registrada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/* OBTENER VALORACIÓN PROMEDIO */
exports.obtenerValoracion = async (req, res) => {
    try {
        const { id } = req.params;


        const existeProducto = await pool.query("SELECT id FROM productos WHERE id = $1", [id]);
        if (existeProducto.rows.length === 0) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        const result = await pool.query(
            "SELECT ROUND(AVG(valoracion), 1) as promedio, COUNT(*) as total FROM valoraciones WHERE producto_id=$1",
            [id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};