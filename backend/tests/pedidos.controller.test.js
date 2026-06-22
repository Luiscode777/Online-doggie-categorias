// tests/pedidos.controller.test.js

const pedidosController = require('../src/controllers/pedidos.controller');
const pool = require('../src/config/db');

jest.mock('../src/config/db');

describe('Pedidos Controller', () => {

    let req;
    let res;
    let client;

    beforeEach(() => {

        req = {
            body: {},
            usuario: {
                id: 1
            },
            params: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        client = {
            query: jest.fn(),
            release: jest.fn()
        };

        pool.connect.mockResolvedValue(client);

        jest.clearAllMocks();
    });

    describe('crearPedido', () => {

        it('debería retornar 400 si el carrito está vacío', async () => {

            req.body.carrito = [];

            await pedidosController.crearPedido(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Carrito vacío'
            });
        });

        it('debería crear pedido correctamente', async () => {

            req.body.carrito = [
                {
                    id: 1,
                    cantidad: 2
                }
            ];

            client.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({
                    rows: [
                        {
                            id: 1,
                            nombre: 'Dog Food',
                            precio: 100,
                            stock: 10
                        }
                    ]
                })
                .mockResolvedValueOnce({
                    rows: [{ id: 99 }]
                })
                .mockResolvedValueOnce() // INSERT detalle
                .mockResolvedValueOnce() // UPDATE stock
                .mockResolvedValueOnce(); // COMMIT

            await pedidosController.crearPedido(req, res);

            expect(client.query).toHaveBeenCalledWith('BEGIN');

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Pedido confirmado',
                pedido_id: 99
            });

            expect(client.release).toHaveBeenCalled();
        });

        it('debería retornar error si producto no existe', async () => {

            req.body.carrito = [
                {
                    id: 999,
                    cantidad: 1
                }
            ];

            client.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({
                    rows: []
                })
                .mockResolvedValueOnce(); // ROLLBACK

            await pedidosController.crearPedido(req, res);

            expect(client.query).toHaveBeenCalledWith('ROLLBACK');

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json.mock.calls[0][0].error)
                .toContain('no existe');
        });

        it('debería retornar error si stock insuficiente', async () => {

            req.body.carrito = [
                {
                    id: 1,
                    cantidad: 50
                }
            ];

            client.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({
                    rows: [
                        {
                            id: 1,
                            nombre: 'Dog Food',
                            precio: 100,
                            stock: 2
                        }
                    ]
                })
                .mockResolvedValueOnce(); // ROLLBACK

            await pedidosController.crearPedido(req, res);

            expect(client.query).toHaveBeenCalledWith('ROLLBACK');

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: 'Stock insuficiente para Dog Food'
            });
        });

        it('debería hacer rollback si ocurre error inesperado', async () => {

            req.body.carrito = [
                {
                    id: 1,
                    cantidad: 1
                }
            ];

            client.query.mockRejectedValue(new Error('DB Error'));

            await pedidosController.crearPedido(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: 'DB Error'
            });

            expect(client.release).toHaveBeenCalled();
        });

    });

    describe('obtenerHistorial', () => {

        it('debería retornar historial agrupado', async () => {

            pool.query.mockResolvedValue({
                rows: [
                    {
                        pedido_id: 1,
                        total: 200,
                        fecha: '2025-01-01',
                        estado: 'pagado',
                        producto_id: 1,
                        nombre: 'Dog Food',
                        cantidad: 2,
                        precio: 100
                    }
                ]
            });

            await pedidosController.obtenerHistorial(req, res);

            expect(res.json).toHaveBeenCalled();

            const response = res.json.mock.calls[0][0];

            expect(response[0].pedido_id).toBe(1);

            expect(response[0].productos.length).toBe(1);
        });

        it('debería retornar 500 si falla historial', async () => {

            pool.query.mockRejectedValue(new Error('Error historial'));

            await pedidosController.obtenerHistorial(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: 'Error historial'
            });
        });

    });

    describe('simularEstadoEnvio', () => {

        it('debería retornar 400 si no se envía estado', async () => {

            req.body = {};
            req.params.id = 1;

            await pedidosController.simularEstadoEnvio(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: 'Estado no válido'
            });
        });

        it('debería retornar 400 si el estado es inválido', async () => {

            req.body = {
                nuevoEstado: 'estado_fake'
            };

            req.params.id = 1;

            await pedidosController.simularEstadoEnvio(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith({
                error: 'Estado no válido'
            });
        });

        it('debería actualizar estado correctamente', async () => {

            req.body = {
                nuevoEstado: 'enviado'
            };

            req.params.id = 1;

            pool.query.mockResolvedValue({
                rowCount: 1
            });

            await pedidosController.simularEstadoEnvio(req, res);

            expect(pool.query).toHaveBeenCalled();

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Estado actualizado con éxito',
                notificacion: 'El pedido #1 ahora está: enviado'
            });
        });

        it('debería retornar 500 si falla actualización de estado', async () => {

            req.body = {
                nuevoEstado: 'enviado'
            };

            req.params.id = 1;

            pool.query.mockRejectedValue(new Error('DB Error'));

            await pedidosController.simularEstadoEnvio(req, res);

            expect(res.status).toHaveBeenCalledWith(500);

            expect(res.json).toHaveBeenCalledWith({
                error: 'DB Error'
            });
        });

    });

});