CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    direccion TEXT,

    rol tipo_rol NOT NULL DEFAULT 'usuario',

    activo BOOLEAN DEFAULT TRUE,

    creado_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    codigo_verificacion VARCHAR(20),
    verificacion_expira TIMESTAMPTZ,

    cuenta_verificada BOOLEAN DEFAULT FALSE,

    dos_fa_activa BOOLEAN DEFAULT FALSE,
    codigo_2fa VARCHAR(20),
    codigo_2fa_expira TIMESTAMPTZ
);