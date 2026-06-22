const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/registro', authController.registro);
router.post('/verificarCuenta', authController.verificarCuenta);
router.post('/login', authController.login);
router.post('/recuperar', authController.recuperarPassword);
router.post('/verificar-2fa', authController.verificar2FA);

router.get('/perfil', verificarToken, authController.obtenerPerfil);
router.put('/perfil', verificarToken, authController.editarPerfil);
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

module.exports = router;