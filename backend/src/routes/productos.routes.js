const express = require('express');
const router = express.Router();

const productosController = require('../controllers/productos.controller');
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');

router.get('/', productosController.obtenerProductos);
router.get('/stock-bajo', verificarAdmin, productosController.stockBajo);

router.post('/', verificarAdmin, productosController.upload.single('imagen'), productosController.crearProducto);
router.put('/:id', verificarAdmin, productosController.upload.single('imagen'), productosController.actualizarProducto);
router.patch('/:id/stock', verificarAdmin, productosController.actualizarStock);
router.delete('/:id', verificarAdmin, productosController.eliminarProducto);

router.post('/:id/valorar', verificarToken, productosController.valorarProducto);
router.get('/:id/valoracion', productosController.obtenerValoracion);

module.exports = router;