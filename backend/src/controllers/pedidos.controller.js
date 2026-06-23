const pool = require('../config/db');
const emailService = require('../utils/emailService');
const { generatePaymentQR } = require('../utils/qrService');

exports.crearPedido = async (req, res) => {
    const client = await pool.connect();

    try {
        const { carrito } = req.body;
        const current_user = req.usuario;

        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ mensaje: "Carrito vacío" });
        }

        if (!current_user?.email) {
            return res.status(401).json({ error: "Email no viene en el token JWT" });
        }

        await client.query("BEGIN");

        let total = 0;
        const productosDB = [];

        for (const item of carrito) {
            const result = await client.query(
                "SELECT * FROM productos WHERE id = $1",
                [item.id]
            );

            if (!result.rows.length) {
                throw new Error(`Producto ${item.id} no existe`);
            }

            const producto = result.rows[0];

            if (producto.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}`);
            }

            total += Number(producto.precio) * Number(item.cantidad);

            productosDB.push({ producto, item });
        }

        const pedidoResult = await client.query(
            `INSERT INTO pedidos (usuario_id, total)
             VALUES ($1, $2)
             RETURNING id`,
            [current_user.id, total]
        );

        const pedido_id = pedidoResult.rows[0].id;

        for (const { producto, item } of productosDB) {
            await client.query(
                `INSERT INTO detalle_pedido
                 (pedido_id, producto_id, cantidad, precio_unitario)
                 VALUES ($1, $2, $3, $4)`,
                [pedido_id, producto.id, item.cantidad, producto.precio]
            );

            await client.query(
                `UPDATE productos
                 SET stock = stock - $1
                 WHERE id = $2`,
                [item.cantidad, producto.id]
            );
        }

        await client.query("COMMIT");

        const itemsCorreo = productosDB.map(({ producto, item }) => ({
            name: producto.nombre,
            quantity: item.cantidad,
            price: producto.precio,
            image: producto.imagen
                ? `http://localhost:3000/uploads/${producto.imagen}`
                : null
        }));

        const { qrBase64, paymentInfo } = await generatePaymentQR({
            orderId: pedido_id,
            total
        });

        const telefonoAdmin = process.env.ADMIN_WHATSAPP || "";
        const mensajeWhatsApp = `Hola! Acabo de pagar el pedido #${pedido_id}. Aquí está mi comprobante.`;
        const whatsappUrl = `https://wa.me/${telefonoAdmin}?text=${encodeURIComponent(mensajeWhatsApp)}`;

        const pedidoEmail = {
            id: pedido_id,
            user_name: current_user.nombre,
            user_email: current_user.email,
            total,
            items: itemsCorreo,
            created_at: new Date(),
            whatsappUrl
        };

        await Promise.all([
            emailService.sendPaymentQRToClient({
                order: pedidoEmail,
                qrBase64,
                paymentInfo
            }),
            emailService.sendNewOrderToAdmin({
                order: pedidoEmail
            })
        ]);


        return res.json({
            mensaje: "Pedido confirmed",
            pedido_id,
            whatsappUrl
        });

    } catch (error) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.obtenerHistorial = async (req, res) => {
    try {
        const userId = req.usuario.id;

        const result = await pool.query(
            `SELECT
                p.id AS pedido_id,
                p.total,
                p.fecha,
                p.estado,
                d.producto_id,
                pr.nombre,
                d.cantidad,
                d.precio_unitario AS precio
             FROM pedidos p
             JOIN detalle_pedido d ON p.id = d.pedido_id
             JOIN productos pr ON pr.id = d.producto_id
             WHERE p.usuario_id = $1
             ORDER BY p.id DESC`,
            [userId]
        );

        const pedidos = {};

        result.rows.forEach(row => {
            if (!pedidos[row.pedido_id]) {
                pedidos[row.pedido_id] = {
                    pedido_id: row.pedido_id,
                    total: row.total,
                    fecha: row.fecha,
                    estado: row.estado,
                    productos: []
                };
            }

            pedidos[row.pedido_id].productos.push({
                producto_id: row.producto_id,
                nombre: row.nombre,
                cantidad: row.cantidad,
                precio: row.precio
            });
        });

        return res.json(Object.values(pedidos));

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.actualizarEstadoPedido = async (req, res) => {
    try {
        // Corregido: Agregamos 'pendiente' para que coincida con tu Base de Datos
        const FLOW = {
            pendiente: ["pagado", "cancelado"],
            pendiente_pago: ["pagado", "cancelado"],
            pagado: ["enviado", "cancelado"],
            enviado: ["entregado"],
            entregado: [],
            cancelado: []
        };

        const { id } = req.params;
        const estadoFormateado = req.body.estado?.toLowerCase();

        if (!estadoFormateado) {
            return res.status(400).json({ error: "Estado requerido" });
        }

        if (!FLOW.hasOwnProperty(estadoFormateado)) {
            return res.status(400).json({ error: "Estado destino no válido" });
        }

        const pedidoActual = await pool.query(
            "SELECT estado FROM pedidos WHERE id = $1",
            [id]
        );

        if (pedidoActual.rows.length === 0) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        const estadoActual = pedidoActual.rows[0].estado?.toLowerCase();
        const permitidos = FLOW[estadoActual] || [];

        if (!permitidos.includes(estadoFormateado)) {
            return res.status(400).json({
                error: `No puedes cambiar de ${estadoActual} a ${estadoFormateado}`
            });
        }

        await pool.query(
            `UPDATE pedidos SET estado = $1 WHERE id = $2`,
            [estadoFormateado, id]
        );

        const pedidoResult = await pool.query(
            `SELECT p.*, u.nombre, u.email
             FROM pedidos p
             JOIN usuarios u ON u.id = p.usuario_id
             WHERE p.id = $1`,
            [id]
        );

        const p = pedidoResult.rows[0];

        const pedido = {
            ...p,
            user_email: p.email,
            user_name: p.nombre
        };

        if (estadoFormateado === "enviado") {
            await emailService.sendShippingConfirmationToClient({ order: pedido });
        }

        if (estadoFormateado === "entregado") {
            await emailService.sendDeliveryConfirmationToClient({ order: pedido });
        }

        return res.json({
            mensaje: "Estado actualizado correctamente",
            pedido
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// En tu controllers/pedidos.controller.js

exports.obtenerTodosPedidos = async (req, res) => {
    try {
        const { email } = req.query;

        let queryText = `
            SELECT
                p.id AS pedido_id,
                p.total,
                p.estado,
                p.fecha,
                u.nombre AS usuario_nombre,
                u.email,
                d.cantidad,
                pr.nombre AS producto_nombre
            FROM pedidos p
            JOIN usuarios u ON u.id = p.usuario_id
            LEFT JOIN detalle_pedido d ON p.id = d.pedido_id
            LEFT JOIN productos pr ON pr.id = d.producto_id
        `;

        const queryParams = [];


        if (email) {
            queryText += ` WHERE u.email LIKE $1`;
            queryParams.push(`%${email.trim()}%`); 
        }

        queryText += ` ORDER BY p.id DESC`;

        const result = await pool.query(queryText, queryParams);


        const pedidos = {};
        result.rows.forEach(row => {
            if (!pedidos[row.pedido_id]) {
                pedidos[row.pedido_id] = {
                    id: row.pedido_id,
                    total: row.total,
                    fecha: row.fecha,
                    estado: row.estado,
                    usuario: row.usuario_nombre,
                    email: row.email,
                    productos: []
                };
            }
            if (row.producto_nombre) {
                pedidos[row.pedido_id].productos.push({
                    nombre: row.producto_nombre,
                    cantidad: row.cantidad
                });
            }
        });

        const listaPedidos = Object.values(pedidos);

        if (email && listaPedidos.length === 0) {
            return res.status(404).json({ error: `No se encontraron compras vinculadas al correo: ${email}` });
        }

        return res.json(listaPedidos);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.confirmarEntrega = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `UPDATE pedidos
             SET estado = 'entregado'
             WHERE delivery_token = $1
             RETURNING *`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Token inválido" });
        }

        return res.json({
            mensaje: "Entrega confirmada",
            pedido: result.rows[0]
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.confirmarEntregaCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.usuario.id;


        const result = await pool.query(
            `UPDATE pedidos
             SET estado = 'entregado'
             WHERE id = $1 AND usuario_id = $2 AND estado = 'enviado'
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                error: "Pedido no encontrado, no te pertenece o aún no ha sido enviado."
            });
        }

        const pedidoModificado = result.rows[0];


        const pedidoEmail = {
            ...pedidoModificado,
            user_email: req.usuario.email,
            user_name: req.usuario.nombre
        };
        await emailService.sendDeliveryConfirmationToClient({ order: pedidoEmail });

        return res.json({
            mensaje: "¡Gracias por confirmar tu entrega! Esperamos que disfrutes tu compra. 🐾",
            pedido: pedidoModificado
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};