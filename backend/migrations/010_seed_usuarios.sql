INSERT INTO usuarios (
    id,
    nombre,
    email,
    password,
    direccion,
    rol,
    activo,
    creado_at,
    codigo_verificacion,
    verificacion_expira,
    cuenta_verificada,
    dos_fa_activa,
    codigo_2fa,
    codigo_2fa_expira
)
VALUES

(
1,
'Emmanuel',
'Emma@gmail.com',
'$2b$10$bRnugg5TLRbHaGhGubTTmOFRMfI17quTAZcXETxKwWa5hJtwPHB62',
NULL,
'usuario',
true,
'2026-05-02 13:19:44.31902-05',
NULL,
NULL,
false,
false,
NULL,
NULL
),

(
2,
'Administrador',
'Admin@gmail.com',
'$2b$10$8FeSpr7WRoVobVhAe0UKCe2EObJqWScFSHZrahiRkWHiFsAXyo.1u',
'Direccion Test Playwright',
'admin',
true,
'2026-05-02 13:19:44.31902-05',
NULL,
NULL,
true,
false,
NULL,
NULL
),

(
3,
'kelly',
'enelestudio1404@gmail.com',
'$2b$10$u2uXg.LBZQGDANJ2ZDZXdeQwDT7rpD2rfwbHVRvb2XdLVvXm77olS',
'call 55 sur #55 B - 25',
'usuario',
true,
'2026-05-25 19:30:20.254999-05',
NULL,
NULL,
true,
false,
NULL,
NULL
),

(
4,
'No Verificado',
'no_verificado@gmail.com',
'$2b$10$VLRAx/buA3DlgR0p6m4LN.guFSQ86GCTPEefRTQWMSzxaJVGnO6Mm',
'Calle',
'usuario',
true,
'2026-05-26 17:51:47.211693-05',
'152658',
'2026-06-09 07:38:21.414-05',
false,
false,
NULL,
NULL
);