const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');

describe('Pruebas Avanzadas de Autenticación - ONLINE-DOGGIE', () => {

    beforeAll(async () => {
        await pool.query(
            "DELETE FROM usuarios WHERE email IN ($1, $2)",
            ['test_doggie@gmail.com', 'no_existe@gmail.com']
        );
    });

    afterAll(async () => {
        await pool.query(
            "DELETE FROM usuarios WHERE email IN ($1, $2)",
            ['test_doggie@gmail.com', 'no_existe@gmail.com']
        );

        await pool.end();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    let codigoVerificacion = "";
    let tokenUsuario = "";

    // CASOS DE REGISTRO

    it('Debería registrar un nuevo usuario correctamente', async () => {
        const res = await request(app)
            .post('/api/auth/registro')
            .send({
                nombre: 'Doggie Test',
                email: 'test_doggie@gmail.com',
                password: 'password123',
                direccion: 'Calle Falsa 123'
            });

        expect(res.statusCode).toEqual(200);

        codigoVerificacion = res.body.codigoSimulado;
    });

    it('Debería fallar si faltan campos obligatorios en el registro', async () => {
        const res = await request(app)
            .post('/api/auth/registro')
            .send({
                nombre: 'Doggie Incompleto'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('Debería fallar si la contraseña tiene menos de 8 caracteres', async () => {
        const res = await request(app)
            .post('/api/auth/registro')
            .send({
                nombre: 'Doggie Corto',
                email: 'corto@gmail.com',
                password: '123',
                direccion: 'Calle Falsa 123'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('Debería fallar si se intenta registrar un email ya existente', async () => {
        const res = await request(app)
            .post('/api/auth/registro')
            .send({
                nombre: 'Doggie Repetido',
                email: 'test_doggie@gmail.com',
                password: 'password123',
                direccion: 'Av. Siempre Viva'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('Debería entrar al catch de registro y retornar 500 si la base de datos se rompe', async () => {
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Database crash'));

        const res = await request(app)
            .post('/api/auth/registro')
            .send({
                nombre: 'Doggie Error',
                email: 'error_db@gmail.com',
                password: 'password123',
                direccion: 'Calle Falsa'
            });

        expect(res.statusCode).toEqual(500);
    });

    // CASOS DE VERIFICACIÓN

    it('Debería rechazar la verificación si el código es incorrecto', async () => {
        const res = await request(app)
            .post('/api/auth/verificarCuenta')
            .send({
                email: 'test_doggie@gmail.com',
                codigo: '000000'
            });

        expect(res.statusCode).toEqual(401);
    });

    it('Debería dar error si se intenta verificar un correo que no existe', async () => {
        const res = await request(app)
            .post('/api/auth/verificarCuenta')
            .send({
                email: 'no_existe@gmail.com',
                codigo: '123456'
            });

        expect(res.statusCode).toEqual(404);
    });

    it('Debería verificar la cuenta exitosamente con el código correcto', async () => {
        const res = await request(app)
            .post('/api/auth/verificarCuenta')
            .send({
                email: 'test_doggie@gmail.com',
                codigo: codigoVerificacion
            });

        expect(res.statusCode).toEqual(200);
    });

    it('Debería entrar al catch de verificación si ocurre un fallo interno', async () => {
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Verification crash'));

        const res = await request(app)
            .post('/api/auth/verificarCuenta')
            .send({
                email: 'test_doggie@gmail.com',
                codigo: '123456'
            });

        expect(res.statusCode).toEqual(500);
    });

    // CASOS DE LOGIN

    it('Debería rechazar el login si la contraseña es incorrecta', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test_doggie@gmail.com',
                password: 'clave_incorrecta'
            });

        expect(res.statusCode).toEqual(401);
    });

    it('Debería rechazar el login si el correo no está registrado', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'no_existe@gmail.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(404);
    });

    it('Debería loguear con éxito y retornar el token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test_doggie@gmail.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);

        tokenUsuario = res.body.token || res.body.accessToken;
    });

    it('Debería entrar al catch de login si el servidor de base de datos no responde', async () => {
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Login crash'));

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test_doggie@gmail.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(500);
    });

    // PERFIL Y SEGURIDAD (MIDDLEWARES)

    it('Debería denegar el acceso a /perfil si no se envía un token', async () => {
        const res = await request(app).get('/api/auth/perfil');

        expect(res.statusCode).toEqual(401);
    });

    it('Debería retornar los datos del usuario en /perfil con un token válido', async () => {
        const res = await request(app)
            .get('/api/auth/perfil')
            .set('Authorization', `Bearer ${tokenUsuario}`);

        expect(res.statusCode).toEqual(200);

        expect(res.body).toHaveProperty('email', 'test_doggie@gmail.com');
    });

    // EDITAR PERFIL

    it('Debería editar el perfil correctamente', async () => {
        const res = await request(app)
            .put('/api/auth/perfil')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                nombre: 'Doggie Editado',
                email: 'test_doggie@gmail.com',
                direccion: 'Nueva dirección'
            });

        expect(res.statusCode).toEqual(200);
    });

    it('Debería fallar al editar perfil si falta nombre o email', async () => {
        const res = await request(app)
            .put('/api/auth/perfil')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                nombre: '',
                email: ''
            });

        expect(res.statusCode).toEqual(400);
    });

    it('Debería entrar al catch de editarPerfil', async () => {
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Edit crash'));

        const res = await request(app)
            .put('/api/auth/perfil')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                nombre: 'Doggie',
                email: 'doggie@gmail.com'
            });

        expect(res.statusCode).toEqual(500);
    });

    // CAMBIAR PASSWORD

    it('Debería cambiar la contraseña correctamente', async () => {
        const res = await request(app)
            .put('/api/auth/cambiar-password')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                passwordActual: 'password123',
                passwordNueva: 'nuevaPassword123'
            });

        expect(res.statusCode).toEqual(200);
    });

    it('Debería rechazar contraseña actual incorrecta', async () => {
        const res = await request(app)
            .put('/api/auth/cambiar-password')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                passwordActual: 'incorrecta',
                passwordNueva: 'otraPassword123'
            });

        expect(res.statusCode).toEqual(401);
    });

    it('Debería fallar si la nueva contraseña es corta', async () => {
        const res = await request(app)
            .put('/api/auth/cambiar-password')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                passwordActual: 'nuevaPassword123',
                passwordNueva: '123'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('Debería entrar al catch de cambiarPassword', async () => {
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Password crash'));

        const res = await request(app)
            .put('/api/auth/cambiar-password')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                passwordActual: 'nuevaPassword123',
                passwordNueva: 'superPassword123'
            });

        expect(res.statusCode).toEqual(500);
    });

    // RECUPERAR PASSWORD

    it('Debería enviar recuperación de contraseña', async () => {
        const res = await request(app)
            .post('/api/auth/recuperar')
            .send({
                email: 'test_doggie@gmail.com'
            });

        expect(res.statusCode).toEqual(200);
    });

    it('Debería fallar recuperación si el correo no existe', async () => {
        const res = await request(app)
            .post('/api/auth/recuperar')
            .send({
                email: 'correo_fake@gmail.com'
            });

        expect(res.statusCode).toEqual(404);
    });

    it('Debería entrar al catch de recuperarPassword', async () => {
        jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('Recovery crash'));

        const res = await request(app)
            .post('/api/auth/recuperar')
            .send({
                email: 'test_doggie@gmail.com'
            });

        expect(res.statusCode).toEqual(500);
    });

    // --- NUEVAS PRUEBAS PARA CERRAR BRECHAS ---

    it('Debería fallar el registro si el formato del email es inválido', async () => {
        const res = await request(app)
            .post('/api/auth/registro')
            .send({
                nombre: 'Doggie',
                email: 'email-invalido',
                password: 'password123',
                direccion: 'Calle Falsa 123'
            });
        expect(res.statusCode).toEqual(400);
    });

    it('Debería fallar la verificación si la cuenta ya está verificada', async () => {
        // Asumiendo que ya está verificada por el test anterior, lo intentamos otra vez
        const res = await request(app)
            .post('/api/auth/verificarCuenta')
            .send({
                email: 'test_doggie@gmail.com',
                codigo: codigoVerificacion // Re-usar el código aunque sea viejo, el sistema debe detectar que ya está verificada
            });
        // Si tu código tiene un if (usuario.cuenta_verificada), esto lo cubrirá
        expect(res.statusCode).toBe(400);
    });

    it('Debería fallar el login si el usuario no ha verificado su cuenta', async () => {
        // 1. Registramos un usuario nuevo (sin verificar)
        await request(app).post('/api/auth/registro').send({
            nombre: 'No Verificado',
            email: 'no_verificado@gmail.com',
            password: 'password123',
            direccion: 'Calle'
        });

        // 2. Intentamos login
        const res = await request(app).post('/api/auth/login').send({
            email: 'no_verificado@gmail.com',
            password: 'password123'
        });
        expect(res.statusCode).toEqual(403);
    });

    it('Debería fallar la verificación si el código expiró', async () => {
        // Necesitas un usuario con fecha de expiración en el pasado
        // Para esto, puedes hacer un UPDATE manual en la BD usando pool.query
        await pool.query(
            "UPDATE usuarios SET verificacion_expira = $1 WHERE email = $2",
            [new Date(Date.now() - 60000), 'no_verificado@gmail.com'] // Pasado
        );

        const res = await request(app).post('/api/auth/verificarCuenta').send({
            email: 'no_verificado@gmail.com',
            codigo: '123456' // El código no importa, debería fallar por fecha primero
        });
        expect(res.statusCode).toEqual(401);
    });

    it('Debería fallar al editar perfil si el formato de email es inválido', async () => {
        const res = await request(app)
            .put('/api/auth/perfil')
            .set('Authorization', `Bearer ${tokenUsuario}`)
            .send({
                nombre: 'Nuevo Nombre',
                email: 'email-malo'
            });
        expect(res.statusCode).toEqual(400);
    });

    // --- CORRECCIÓN DE PRUEBAS VERIFICAR2FA ---

    it('Debería fallar verificar2FA si faltan datos', async () => {
        const res = await request(app).post('/api/auth/verificar-2fa').send({});
        // Si el endpoint existe, debería ser 400. Si es 404, la ruta está mal escrita.
        expect(res.statusCode).toBe(400); 
    });

    it('Debería fallar verificar2FA si el token es inválido o no está presente', async () => {
        const res = await request(app).post('/api/auth/verificar-2fa').send({
            codigo: '123456',
            tokenTemporal: 'token-invalido-123'
        });
        expect(res.statusCode).toBe(401);
    });

    it('Debería fallar verificar2FA si el usuario asociado al token no existe', async () => {
        const tokenInexistente = jwt.sign({ id: 99999 }, process.env.JWT_SECRET);
        
        const res = await request(app).post('/api/auth/verificar-2fa').send({
            codigo: '123456',
            tokenTemporal: tokenInexistente
        });
        expect(res.statusCode).toBe(404);
    });
});