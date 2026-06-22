CREATE TABLE IF NOT EXISTS detalle_pedido (
    id BIGSERIAL PRIMARY KEY,

    pedido_id BIGINT NOT NULL
        REFERENCES pedidos(id)
        ON DELETE CASCADE,

    producto_id BIGINT NOT NULL
        REFERENCES productos(id)
        ON DELETE CASCADE,

    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    precio_unitario NUMERIC(10,2) NOT NULL
);