CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,

    categoria_id INTEGER
        REFERENCES categorias(id)
        ON DELETE SET NULL,

    nombre VARCHAR(255) NOT NULL,

    descripcion TEXT,

    precio NUMERIC(10,2) NOT NULL,

    imagen VARCHAR(255),

    stock INTEGER DEFAULT 0,

    activo BOOLEAN DEFAULT TRUE,

    creado_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);