const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/auth.middleware');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();

        process.env.JWT_SECRET = 'testsecret';

        jest.clearAllMocks();
    });

    describe('verificarToken', () => {

        it('debería retornar 401 si no existe authorization header', () => {
            authMiddleware.verificarToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Token requerido o formato inválido'
            });

            expect(next).not.toHaveBeenCalled();
        });

        it('debería retornar 401 si el formato bearer es inválido', () => {
            req.headers.authorization = 'Token abc123';

            authMiddleware.verificarToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Token requerido o formato inválido'
            });

            expect(next).not.toHaveBeenCalled();
        });

        it('debería retornar 401 si el token es inválido', () => {
            req.headers.authorization = 'Bearer token_invalido';

            jwt.verify.mockImplementation(() => {
                throw new Error('Token inválido');
            });

            authMiddleware.verificarToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(401);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Token inválido'
            });

            expect(next).not.toHaveBeenCalled();
        });

        it('debería asignar usuario y ejecutar next si el token es válido', () => {
            req.headers.authorization = 'Bearer token_valido';

            const usuarioMock = {
                id: 1,
                rol: 'admin'
            };

            jwt.verify.mockReturnValue(usuarioMock);

            authMiddleware.verificarToken(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith(
                'token_valido',
                process.env.JWT_SECRET
            );

            expect(req.usuario).toEqual(usuarioMock);

            expect(next).toHaveBeenCalled();
        });

    });

    describe('verificarAdmin', () => {

        it('debería retornar 401 si el token no existe', () => {
            authMiddleware.verificarAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Token requerido o formato inválido'
            });

            expect(next).not.toHaveBeenCalled();
        });

        it('debería retornar 403 si el usuario no es admin', () => {
            req.headers.authorization = 'Bearer token_cliente';

            jwt.verify.mockReturnValue({
                id: 1,
                rol: 'cliente'
            });

            authMiddleware.verificarAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'No autorizado'
            });

            expect(next).not.toHaveBeenCalled();
        });

        it('debería ejecutar next si el usuario es admin', () => {
            req.headers.authorization = 'Bearer token_admin';

            jwt.verify.mockReturnValue({
                id: 2,
                rol: 'admin'
            });

            authMiddleware.verificarAdmin(req, res, next);

            expect(next).toHaveBeenCalled();

            expect(res.status).not.toHaveBeenCalled();
        });

    });

});