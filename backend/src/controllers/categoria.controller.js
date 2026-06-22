const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Obtener todas las categorías para listarlas en el Front-End
exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: { nombre: 'asc' }
        });
        return res.json(categorias);
    } catch (error) {
        console.error("Error en obtenerCategorias:", error);
        return res.status(500).json({ error: 'Error interno del servidor al obtener categorías' });
    }
};

// 2. Crear una nueva categoría desde el panel de administración
exports.crearCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
        }

        // Validar si ya existe una con el mismo nombre para no duplicar
        const categoriaExiste = await prisma.categoria.findFirst({
            where: { nombre: { equals: nombre.trim(), mode: 'insensitive' } }
        });

        if (categoriaExiste) {
            return res.status(400).json({ error: 'Esta categoría ya existe en el sistema' });
        }

        const nuevaCategoria = await prisma.categoria.create({
            data: { nombre: nombre.trim() }
        });

        return res.status(201).json(nuevaCategoria);
    } catch (error) {
        console.error("Error en crearCategoria:", error);
        return res.status(500).json({ error: 'Error interno al crear la categoría' });
    }
};

// 3. Eliminar una categoría de forma segura (Controlando integridad referencial)
exports.eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const idNumero = parseInt(id);

        if (isNaN(idNumero)) {
            return res.status(400).json({ error: 'ID de categoría inválido' });
        }

        // REGLA DE NEGOCIO: Verificar si hay productos asociados a esta categoría
        // Nota: Asegúrate de que en tu esquema de Prisma la relación se llame 'productos' o 'Producto'
        const productosAsociados = await prisma.producto.count({
            where: { categoriaId: idNumero } 
        });

        if (productosAsociados > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar. Hay ${productosAsociados} producto(s) asignado(s) a esta categoría.` 
            });
        }

        await prisma.categoria.delete({
            where: { id: idNumero }
        });

        return res.json({ mensaje: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error("Error en eliminarCategoria:", error);
        return res.status(500).json({ error: 'Error interno al eliminar la categoría' });
    }
};