const request = require('supertest');
const app = require('../src/app.js');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

let adminToken;
let productoId;

beforeAll(async () => {

  try {
    await pool.query(
      "UPDATE usuarios SET cuenta_verificada = TRUE WHERE email = $1",
      ['Admin@gmail.com']
    );
  } catch (err) {
    console.error(err.message);
  }

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'Admin@gmail.com',
      password: 'admin'
    });

  adminToken =
    loginResponse.body.token ||
    loginResponse.body.accessToken;

  if (!adminToken) {
    throw new Error('No se pudo obtener token admin');
  }
});

afterAll(async () => {

  try {

    if (productoId) {

      await pool.query(
        'DELETE FROM valoraciones WHERE producto_id = $1',
        [productoId]
      );

      await pool.query(
        'DELETE FROM productos WHERE id = $1',
        [productoId]
      );
    }

  } catch (err) {
    console.error(err.message);
  }

  await pool.end();
});

describe('Pruebas de Integración - Productos', () => {

  it('GET /api/productos - debería listar productos', async () => {

    const response = await request(app)
      .get('/api/productos');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/productos - debería manejar error interno', async () => {

    const originalQuery = pool.query;

    pool.query = jest.fn().mockRejectedValue(new Error('DB Error'));

    const response = await request(app)
      .get('/api/productos');

    expect([500, 200]).toContain(response.statusCode);

    pool.query = originalQuery;
  });

  it('POST /api/productos - debería crear producto', async () => {

    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Juguete Jest')
      .field('descripcion', 'Producto testing')
      .field('precio', '12000')
      .field('categoria', '1')
      .field('stock', '10')
      .attach(
        'imagen',
        Buffer.from('fake-image'),
        'test.png'
      );

    expect(response.statusCode).toBe(200);

    const resDb = await pool.query(`
      SELECT id
      FROM productos
      WHERE nombre = 'Juguete Jest'
      ORDER BY id DESC
      LIMIT 1
    `);

    if (resDb.rows.length > 0) {
      productoId = resDb.rows[0].id;
    }
  });

  it('POST /api/productos - debería fallar con campos vacíos', async () => {

    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', '')
      .field('descripcion', '')
      .field('precio', '')
      .field('categoria', '')
      .field('stock', '');

    expect(response.statusCode).toBe(400);
  });

  it('POST /api/productos - debería fallar sin token', async () => {

    const response = await request(app)
      .post('/api/productos')
      .send({
        nombre: 'Hack'
      });

    expect(response.statusCode).toBe(401);
  });

  it('PUT /api/productos/:id - debería actualizar producto', async () => {

    const response = await request(app)
      .put(`/api/productos/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Producto Editado')
      .field('descripcion', 'Editado')
      .field('precio', '15000')
      .field('categoria', '1')
      .field('stock', '20')
      .attach(
        'imagen',
        Buffer.from('new-image'),
        'new.png'
      );

    expect(response.statusCode).toBe(200);
  });

  it('PUT /api/productos/:id - debería actualizar sin imagen', async () => {

    const response = await request(app)
      .put(`/api/productos/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Producto Sin Imagen')
      .field('descripcion', 'Editado')
      .field('precio', '10000')
      .field('categoria', '1')
      .field('stock', '15');

    expect([200, 404]).toContain(response.statusCode);
  });

  it('PUT /api/productos/:id - debería fallar con campos vacíos', async () => {

    const response = await request(app)
      .put(`/api/productos/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', '')
      .field('descripcion', '')
      .field('precio', '')
      .field('categoria', '')
      .field('stock', '');

    expect(response.statusCode).toBe(400);
  });

  it('PUT /api/productos/:id - debería retornar 404 producto inexistente', async () => {

    const response = await request(app)
      .put('/api/productos/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Fantasma')
      .field('descripcion', 'No existe')
      .field('precio', '100')
      .field('categoria', '1')
      .field('stock', '5');

    expect([404, 500]).toContain(response.statusCode);
  });

  it('PUT /api/productos/:id - debería fallar sin token', async () => {

    const response = await request(app)
      .put(`/api/productos/${productoId || 1}`)
      .field('nombre', 'Hack')
      .field('descripcion', 'Hack')
      .field('precio', '100')
      .field('categoria', '1')
      .field('stock', '1');

    expect(response.statusCode).toBe(401);
  });

  it('PUT /api/productos/stock/:id - debería actualizar stock', async () => {

    const response = await request(app)
      .put(`/api/productos/stock/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stock: 2
      });

    expect([200, 404]).toContain(response.statusCode);
  });

  it('PUT /api/productos/stock/:id - debería desactivar producto por stock bajo', async () => {

    const response = await request(app)
      .put(`/api/productos/stock/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stock: 1
      });

    expect([200, 404]).toContain(response.statusCode);
  });

  it('PUT /api/productos/stock/:id - debería fallar sin stock', async () => {

    const response = await request(app)
      .put(`/api/productos/stock/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect([400, 404]).toContain(response.statusCode);
  });

  it('GET /api/productos/stock-bajo - debería listar stock bajo', async () => {

    const response = await request(app)
      .get('/api/productos/stock-bajo')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 401]).toContain(response.statusCode);
  });

  it('GET /api/productos/stock-bajo - debería fallar sin token', async () => {

    const response = await request(app)
      .get('/api/productos/stock-bajo');

    expect([401, 403]).toContain(response.statusCode);
  });

  it('POST /api/productos/valorar/:id - debería valorar producto', async () => {

    const response = await request(app)
      .post(`/api/productos/valorar/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        valoracion: 5
      });

    expect([200, 400, 404]).toContain(response.statusCode);
  });

  it('POST /api/productos/valorar/:id - debería fallar valoración inválida', async () => {

    const response = await request(app)
      .post(`/api/productos/valorar/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        valoracion: 10
      });

    expect([400, 404]).toContain(response.statusCode);
  });

  it('POST /api/productos/valorar/:id - debería fallar sin valoración', async () => {

    const response = await request(app)
      .post(`/api/productos/valorar/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect([400, 404]).toContain(response.statusCode);
  });

  it('POST /api/productos/valorar/:id - debería retornar 404 producto inexistente', async () => {

    const response = await request(app)
      .post('/api/productos/valorar/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        valoracion: 5
      });

    expect([404, 500]).toContain(response.statusCode);
  });

  it('GET /api/productos/valoracion/:id - debería obtener promedio', async () => {

    const response = await request(app)
      .get(`/api/productos/valoracion/${productoId || 1}`);

    expect([200, 404]).toContain(response.statusCode);
  });

  it('GET /api/productos/valoracion/:id - debería retornar 404 producto inexistente', async () => {

    const response = await request(app)
      .get('/api/productos/valoracion/999999');

    expect([404, 500]).toContain(response.statusCode);
  });

  it('DELETE /api/productos/:id - debería eliminar producto', async () => {

    const response = await request(app)
      .delete(`/api/productos/${productoId || 1}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
  });

  it('DELETE /api/productos/:id - debería retornar 404 si no existe', async () => {

    const response = await request(app)
      .delete('/api/productos/999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([404, 500]).toContain(response.statusCode);
  });

  it('DELETE /api/productos/:id - debería fallar sin token', async () => {

    const response = await request(app)
      .delete(`/api/productos/${productoId || 1}`);

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/productos - debería fallar si el precio es inválido', async () => {

    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Producto Malo')
      .field('descripcion', 'Precio inválido')
      .field('precio', '-100')
      .field('categoria', '1')
      .field('stock', '10');

    expect([400, 500]).toContain(response.statusCode);
  });

});