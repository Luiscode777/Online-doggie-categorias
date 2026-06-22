const productosController = require('../src/controllers/productos.controller');
const pool = require('../src/config/db');

jest.mock('../src/config/db');

describe('Productos Controller', () => {

    let req;
    let res;

    beforeEach(() => {

        req = {
            body: {},
            params: {},
            usuario: {
                id: 1
            },
            file: null
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('obtenerProductos', () => {

        it('debería obtener productos', async () => {

            pool.query.mockResolvedValue({
                rows: [{ id: 1, nombre: 'Producto' }]
            });

            await productosController.obtenerProductos(req, res);

            expect(res.json).toHaveBeenCalledWith([
                { id: 1, nombre: 'Producto' }
            ]);
        });

        it('debería manejar errores', async () => {

            pool.query.mockRejectedValue(new Error('DB Error'));

            await productosController.obtenerProductos(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('crearProducto', () => {

        it('debería retornar 400 si faltan campos', async () => {

            req.body = {};

            await productosController.crearProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería crear producto', async () => {

            req.body = {
                nombre: 'Producto',
                descripcion: 'Desc',
                precio: 1000,
                categoria: 1,
                stock: 10
            };

            req.file = {
                filename: 'imagen.png'
            };

            pool.query.mockResolvedValue({});

            await productosController.crearProducto(req, res);

            expect(res.json).toHaveBeenCalledWith({
                mensaje: 'Producto creado'
            });
        });
    });

    describe('actualizarProducto', () => {

        it('debería retornar 400 si faltan campos', async () => {

            req.body = {};
            req.params.id = 1;

            await productosController.actualizarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería actualizar producto con imagen', async () => {

            req.params.id = 1;

            req.body = {
                nombre: 'Nuevo',
                descripcion: 'Desc',
                precio: 1000,
                categoria: 1,
                stock: 5
            };

            req.file = {
                filename: 'test.png'
            };

            pool.query.mockResolvedValue({
                rowCount: 1
            });

            await productosController.actualizarProducto(req, res);

            expect(res.json).toHaveBeenCalled();
        });

        it('debería actualizar producto sin imagen', async () => {

            req.params.id = 1;

            req.body = {
                nombre: 'Nuevo',
                descripcion: 'Desc',
                precio: 1000,
                categoria: 1,
                stock: 5
            };

            pool.query.mockResolvedValue({
                rowCount: 1
            });

            await productosController.actualizarProducto(req, res);

            expect(res.json).toHaveBeenCalled();
        });

        it('debería retornar 404 si no existe', async () => {

            req.params.id = 999;

            req.body = {
                nombre: 'Nuevo',
                descripcion: 'Desc',
                precio: 1000,
                categoria: 1,
                stock: 5
            };

            pool.query.mockResolvedValue({
                rowCount: 0
            });

            await productosController.actualizarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('eliminarProducto', () => {

        it('debería eliminar producto', async () => {

            req.params.id = 1;

            pool.query.mockResolvedValue({
                rowCount: 1
            });

            await productosController.eliminarProducto(req, res);

            expect(res.json).toHaveBeenCalled();
        });

        it('debería retornar 404 si no existe', async () => {

            req.params.id = 999;

            pool.query.mockResolvedValue({
                rowCount: 0
            });

            await productosController.eliminarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('actualizarStock', () => {

        it('debería retornar 400 sin stock', async () => {

            req.params.id = 1;
            req.body = {};

            await productosController.actualizarStock(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería actualizar stock', async () => {

            req.params.id = 1;

            req.body = {
                stock: 10
            };

            pool.query.mockResolvedValue({
                rowCount: 1
            });

            await productosController.actualizarStock(req, res);

            expect(res.json).toHaveBeenCalled();
        });

        it('debería retornar 404 si no existe', async () => {

            req.params.id = 999;

            req.body = {
                stock: 10
            };

            pool.query.mockResolvedValue({
                rowCount: 0
            });

            await productosController.actualizarStock(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('valorarProducto', () => {

        it('debería retornar 400 si valoración inválida', async () => {

            req.params.id = 1;

            req.body = {
                valoracion: 10
            };

            await productosController.valorarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería retornar 404 si producto no existe', async () => {

            req.params.id = 999;

            req.body = {
                valoracion: 5
            };

            pool.query.mockResolvedValueOnce({
                rows: []
            });

            await productosController.valorarProducto(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('obtenerValoracion', () => {

        it('debería retornar 404 si producto no existe', async () => {

            req.params.id = 999;

            pool.query.mockResolvedValueOnce({
                rows: []
            });

            await productosController.obtenerValoracion(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('debería obtener valoración', async () => {

            req.params.id = 1;

            pool.query
                .mockResolvedValueOnce({
                    rows: [{ id: 1 }]
                })
                .mockResolvedValueOnce({
                    rows: [{
                        promedio: 5,
                        total: 1
                    }]
                });

            await productosController.obtenerValoracion(req, res);

            expect(res.json).toHaveBeenCalledWith({
                promedio: 5,
                total: 1
            });
        });
    });

});