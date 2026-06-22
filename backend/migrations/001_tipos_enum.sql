DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'tipo_rol'
    ) THEN
        CREATE TYPE tipo_rol AS ENUM ('usuario', 'admin');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'estado_pedido'
    ) THEN
        CREATE TYPE estado_pedido AS ENUM (
            'pendiente',
            'pagado',
            'enviado',
            'entregado',
            'cancelado'
        );
    END IF;
END $$;