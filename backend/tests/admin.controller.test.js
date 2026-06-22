const adminController = require('../src/controllers/admin.controller');
const pool = require('../src/config/db');

jest.mock('../src/config/db');

describe('Admin Controller', () => {

    let req;
    let res;

    beforeEach(() => {

        req = {
            body: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('obtenerMetricas', () => {

        it('debería obtener métricas correctamente', async () => {

            pool.query
                .mockResolvedValueOnce({
                    rows: [{ count: '10' }]
                })
                .mockResolvedValueOnce({
                    rows: [{ count: '5' }]
                })
                .mockResolvedValueOnce({
                    rows: [{ sum: '25000' }]
                });

            await adminController.obtenerMetricas(req, res);

            expect(res.json).toHaveBeenCalledWith({
                totalProductos: '10',
                totalUsuarios: '5',
                totalVentas: '25000'
            });
        });

        it('debería manejar errores al obtener métricas', async () => {

            pool.query.mockRejectedValue(new Error('DB Error'));

            await adminController.obtenerMetricas(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al obtener métricas'
            });
        });

    });

    describe('obtenerActividad', () => {

        it('debería obtener actividad correctamente', async () => {

            const actividadMock = [
                { accion: 'Usuario creado' }
            ];

            pool.query.mockResolvedValue({
                rows: actividadMock
            });

            await adminController.obtenerActividad(req, res);

            expect(res.json).toHaveBeenCalledWith(actividadMock);
        });

        it('debería manejar errores al obtener actividad', async () => {

            pool.query.mockRejectedValue(new Error('DB Error'));

            await adminController.obtenerActividad(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al obtener actividad'
            });
        });

    });

    describe('promoverUsuario', () => {

        it('debería promover usuario correctamente', async () => {

            req.body = {
                email: 'test@test.com'
            };

            pool.query
                .mockResolvedValueOnce({
                    rowCount: 1,
                    rows: [{
                        nombre: 'Emmanuel'
                    }]
                })
                .mockResolvedValueOnce({});

            await adminController.promoverUsuario(req, res);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: '¡Emmanuel ahora es Administrador!'
            });
        });

        it('debería retornar 404 si usuario no existe', async () => {

            req.body = {
                email: 'fake@test.com'
            };

            pool.query.mockResolvedValue({
                rowCount: 0,
                rows: []
            });

            await adminController.promoverUsuario(req, res);

            expect(res.status).toHaveBeenCalledWith(404);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Usuario no encontrado'
            });
        });

        it('debería manejar errores al promover usuario', async () => {

            req.body = {
                email: 'test@test.com'
            };

            pool.query.mockRejectedValue(new Error('DB Error'));

            await adminController.promoverUsuario(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al actualizar el rol'
            });
        });

    });

    describe('obtenerTodosPedidos', () => {

        it('debería obtener todos los pedidos', async () => {

            const pedidosMock = [
                {
                    id: 1,
                    total: 5000
                }
            ];

            pool.query.mockResolvedValue({
                rows: pedidosMock
            });

            await adminController.obtenerTodosPedidos(req, res);

            expect(res.json).toHaveBeenCalledWith(pedidosMock);
        });

        it('debería manejar errores al obtener pedidos', async () => {

            pool.query.mockRejectedValue(new Error('DB Error'));

            await adminController.obtenerTodosPedidos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Error al obtener pedidos'
            });
        });

    });

});