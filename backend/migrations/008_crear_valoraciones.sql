CREATE TABLE IF NOT EXISTS valoraciones (
    id BIGSERIAL PRIMARY KEY,

    producto_id BIGINT NOT NULL
        REFERENCES productos(id)
        ON DELETE CASCADE,

    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    valoracion INTEGER NOT NULL
        CHECK (valoracion >= 1 AND valoracion <= 5),

    comentario TEXT,

    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unica_valoracion
        UNIQUE (producto_id, usuario_id)
);