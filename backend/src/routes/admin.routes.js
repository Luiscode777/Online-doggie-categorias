const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller'); 
const { verificarAdmin } = require('../middlewares/auth.middleware')

router.get('/metricas', verificarAdmin, adminCtrl.obtenerMetricas);
router.get('/actividad', verificarAdmin, adminCtrl.obtenerActividad);
router.post('/nuevo-admin', verificarAdmin, adminCtrl.promoverUsuario);
router.get('/pedidos', verificarAdmin, adminCtrl.obtenerTodosPedidos);

module.exports = router;