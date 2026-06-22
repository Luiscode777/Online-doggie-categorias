SELECT setval(
    pg_get_serial_sequence('usuarios', 'id'),
    (SELECT MAX(id) FROM usuarios)
);

SELECT setval(
    pg_get_serial_sequence('categorias', 'id'),
    (SELECT MAX(id) FROM categorias)
);

SELECT setval(
    pg_get_serial_sequence('productos', 'id'),
    (SELECT MAX(id) FROM productos)
);

SELECT setval(
    pg_get_serial_sequence('pedidos', 'id'),
    (SELECT MAX(id) FROM pedidos)
);

SELECT setval(
    pg_get_serial_sequence('detalle_pedido', 'id'),
    (SELECT MAX(id) FROM detalle_pedido)
);

SELECT setval(
    pg_get_serial_sequence('contactos', 'id'),
    COALESCE((SELECT MAX(id) FROM contactos), 1)
);

SELECT setval(
    pg_get_serial_sequence('valoraciones', 'id'),
    COALESCE((SELECT MAX(id) FROM valoraciones), 1)
);