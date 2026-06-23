const pool = require('../config/db');
const { hashPassword, verifyPassword, createToken } = require('../utils/security');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.registro = async (req, res) => {
    try {
        const { nombre, email, password, direccion } = req.body;

        if (!nombre || !email || !password || !direccion) {
            return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailValido) {
            return res.status(400).json({ mensaje: "Formato de correo inválido" });
        }

        if (password.length < 8) {
            return res.status(400).json({ mensaje: "La contraseña debe tener mínimo 8 caracteres" });
        }

        const existe = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1", [email]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ mensaje: "El usuario ya existe" });
        }

        const passwordHash = await hashPassword(password);

        const codigoRegistro = Math.floor(100000 + Math.random() * 900000).toString();
        const expiraRegistro = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            `INSERT INTO usuarios (nombre, email, password, direccion, codigo_verificacion, verificacion_expira, cuenta_verificada) 
             VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
            [nombre, email, passwordHash, direccion, codigoRegistro, expiraRegistro]
        );

        if (process.env.NODE_ENV !== 'test') {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verifica tu cuenta - Online Doggie 🐶',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #0056b3; text-align: center;">¡Bienvenido a Online Doggie, ${nombre}!</h2>
                        <p>Gracias por registrarte. Para completar la creación de tu cuenta y empezar a comprar para tu peludito, por favor ingresa el siguiente código de verificación en la aplicación:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="background-color: #f7f7f7; border: 2px dashed #0056b3; padding: 10px 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px;">
                                ${codigoRegistro}
                            </span>
                        </div>
                        <p style="color: #666; font-size: 14px; text-align: center;">Este código es válido por 15 minutos.</p>
                    </div>
                `
            });
        }

        res.json({
            mensaje: "Usuario registrado correctamente. Revisa tu correo para verificar la cuenta.",
            codigoSimulado: process.env.NODE_ENV === 'test' ? codigoRegistro : undefined
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verificarCuenta = async (req, res) => {
    try {
        const { email, codigo } = req.body;

        if (!email || !codigo) {
            return res.status(400).json({ mensaje: "El correo y el código son obligatorios" });
        }

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1", [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const usuario = result.rows[0];

        if (usuario.cuenta_verificada) {
            return res.status(400).json({ mensaje: "Esta cuenta ya se encuentra verificada" });
        }

        // CORRECCIÓN AQUÍ: Forzamos string y quitamos espacios fantasmas en la comparación
        if (!usuario.codigo_verificacion || usuario.codigo_verificacion.toString().trim() !== codigo.toString().trim()) {
            return res.status(401).json({ mensaje: "El código de verificación es incorrecto" });
        }

        if (new Date() > new Date(usuario.verificacion_expira)) {
            return res.status(401).json({ mensaje: "El código de verificación ha expirado" });
        }

        await pool.query(
            `UPDATE usuarios 
             SET codigo_verificacion = NULL, verificacion_expira = NULL, cuenta_verificada = TRUE 
             WHERE id = $1`,
            [usuario.id]
        );

        res.json({ mensaje: "Cuenta verificada exitosamente. ¡Ya puedes iniciar sesión!" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
        }

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1",
            [email]
        );

        if (!result.rows.length) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const usuario = result.rows[0];

        const valid = await verifyPassword(password, usuario.password);

        if (!valid) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        // === LOG TEMPORAL DE DIAGNÓSTICO — BORRAR DESPUÉS ===
        const crypto = require('crypto');
        const secretVistoAqui = process.env.JWT_SECRET || '';
        console.log('[DEBUG LOGIN] JWT_SECRET hash en auth.controller.js:', crypto.createHash('sha256').update(secretVistoAqui).digest('hex'));
        console.log('[DEBUG LOGIN] JWT_SECRET longitud en auth.controller.js:', secretVistoAqui.length);

        const token = createToken({
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
        });

        console.log('[DEBUG LOGIN] Token generado hash:', crypto.createHash('sha256').update(token).digest('hex'));
        // === FIN LOG TEMPORAL ===

        return res.json({
            mensaje: "Login exitoso",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.verificar2FA = async (req, res) => {
    try {
        const { codigo, tokenTemporal } = req.body;

        if (!codigo || !tokenTemporal) {
            return res.status(400).json({ mensaje: "Datos incompletos" });
        }

        let decoded;
        try {
            decoded = jwt.verify(tokenTemporal, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ mensaje: "Token temporal expirado o inválido" });
        }

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE id = $1", [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const usuario = result.rows[0];

        if (usuario.codigo_2fa !== codigo) {
            return res.status(401).json({ mensaje: "Código incorrecto" });
        }

        if (new Date() > new Date(usuario.codigo_2fa_expira)) {
            return res.status(401).json({ mensaje: "El código ha expirado" });
        }

        await pool.query(
            "UPDATE usuarios SET codigo_2fa = NULL, codigo_2fa_expira = NULL WHERE id = $1",
            [usuario.id]
        );

        const token = createToken({
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol
        });

        res.json({
            mensaje: "Verificación exitosa",
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ mensaje: "El correo es obligatorio" });
        }

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE email = $1", [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: "No existe una cuenta con ese correo" });
        }

        const usuario = result.rows[0];

        const tokenRecuperar = jwt.sign(
            { id: usuario.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        if (process.env.NODE_ENV !== 'test') {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Recuperar contraseña - Online Doggie',
                html: `<p>Hola ${usuario.nombre},</p>
                       <p>Recibimos una solicitud para recuperar tu contraseña.</p>
                       <p>Tu token de recuperación es:</p>
                       <p><strong>${tokenRecuperar}</strong></p>
                       <p>Este enlace expira en 1 hora.</p>`
            });
        }

        res.json({
            mensaje: "Se envió un correo con instrucciones para recuperar tu contraseña",
            tokenSimulado: process.env.NODE_ENV === 'test' ? tokenRecuperar : undefined
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerPerfil = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nombre, email, rol, direccion FROM usuarios WHERE id = $1",
            [req.usuario.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.editarPerfil = async (req, res) => {
    try {
        const { nombre, email, direccion } = req.body;

        if (!nombre || !email) {
            return res.status(400).json({ mensaje: "Nombre y correo son obligatorios" });
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailValido) {
            return res.status(400).json({ mensaje: "Formato de correo inválido" });
        }

        await pool.query(
            "UPDATE usuarios SET nombre = $1, email = $2, direccion = $3 WHERE id = $4",
            [nombre, email, direccion || null, req.usuario.id]
        );

        res.json({ mensaje: "Perfil actualizado correctamente" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({ mensaje: "Todos los campos son obligatorios" });
        }

        if (passwordNueva.length < 8) {
            return res.status(400).json({ mensaje: "La nueva contraseña debe tener mínimo 8 caracteres" });
        }

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE id = $1", [req.usuario.id]
        );

        const usuario = result.rows[0];

        const valid = await verifyPassword(passwordActual, usuario.password);
        if (!valid) {
            return res.status(401).json({ mensaje: "La contraseña actual es incorrecta" });
        }

        const nuevaHash = await hashPassword(passwordNueva);

        await pool.query(
            "UPDATE usuarios SET password = $1 WHERE id = $2",
            [nuevaHash, req.usuario.id]
        );

        res.json({ mensaje: "Contraseña cambiada exitosamente" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};