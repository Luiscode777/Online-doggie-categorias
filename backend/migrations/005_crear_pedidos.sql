CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    total NUMERIC(10,2) NOT NULL,

    estado estado_pedido DEFAULT 'pendiente',

    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);