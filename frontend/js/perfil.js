const token = localStorage.getItem("token");

/* VALIDACIÓN DE SESIÓN INICIAL */
if (!token) {
    mostrarToast("Debes iniciar sesión", "error");
    window.location.href = "Login.html";
    throw new Error("Usuario no autenticado");
}


/* INICIALIZACIÓN Y EVENT LISTENERS */
document.addEventListener("DOMContentLoaded", () => {
    cargarPerfil();
    cargarHistorial();

    cambiarVista('vista-configuracion')

    const formEditarPerfil = document.getElementById("form-editar-perfil");
    const formCambiarPassword = document.getElementById("form-cambiar-password");
    const logoutBtn = document.getElementById("logout-btn");

    if (formEditarPerfil) formEditarPerfil.addEventListener("submit", editarPerfil);
    if (formCambiarPassword) formCambiarPassword.addEventListener("submit", cambiarPassword);
    if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);
});


/* CARGAR PERFIL */
async function cargarPerfil() {
    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/auth/perfil", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!respuesta.ok) {
            mostrarToast("Tu sesión expiró, inicia sesión nuevamente", "error");
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            
            setTimeout(() => {
                window.location.href = "Login.html";
            }, 1500);
            return;
        }

        const usuario = await respuesta.json();

        const perfilNombre = document.getElementById("perfil-nombre");
        const perfilEmail = document.getElementById("perfil-email");
        const perfilRol = document.getElementById("perfil-rol");
        const editNombre = document.getElementById("edit-nombre");
        const editEmail = document.getElementById("edit-email");

        if (perfilNombre) perfilNombre.textContent = usuario.nombre;
        if (perfilEmail) perfilEmail.textContent = usuario.email;
        if (perfilRol) perfilRol.textContent = usuario.rol;
        if (editNombre) editNombre.value = usuario.nombre;
        if (editEmail) editEmail.value = usuario.email;

        if (usuario.direccion) {
            const direccionInput = document.getElementById("input-direccion");
            if (direccionInput) direccionInput.value = usuario.direccion;
        }

    } catch (error) {
        console.error("Error cargando perfil:", error);
    }
}


/* HISTORIAL DE COMPRAS */
async function cargarHistorial() {
    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/pedidos/historial", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!respuesta.ok) return;

        const pedidos = await respuesta.json();
        const tablaBody = document.getElementById("historial-compras-tabla-body");

        if (!tablaBody) return;

        if (!pedidos.length) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #666; padding: 25px;">
                        No tienes compras registradas.
                    </td>
                </tr>`;
            return;
        }

        const clasesEstado = {
            "pendiente": "badge-pendiente",
            "pagado": "badge-enviado",
            "enviado": "badge-enviado",
            "entregado": "badge-entregado",
            "cancelado": "badge-pendiente"
        };

        let filasHtml = "";

        pedidos.forEach(pedido => {
            const estadoTexto = pedido.estado || "pendiente";
            const claseBadge = clasesEstado[estadoTexto.toLowerCase()] || "badge-enviado";

            pedido.productos.forEach(producto => {
                filasHtml += `
                    <tr>
                        <td style="font-weight: bold;">${producto.nombre}</td>
                        <td>$${Number(producto.precio).toLocaleString("es-CO")}</td>
                        <td style="text-align: center;">${producto.cantidad}</td>
                        <td>
                            <span class="badge-estado-tabla ${claseBadge}">
                                ${estadoTexto}
                            </span>
                        </td>
                    </tr>
                `;
            });
        });

        tablaBody.innerHTML = filasHtml;

    } catch (error) {
        console.error("Error cargando historial en tabla:", error);
        const tablaBody = document.getElementById("historial-compras-tabla-body");
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #EF4444; font-weight: bold; padding: 25px;">
                        Error cargando la información del servidor.
                    </td>
                </tr>`;
        }
    }
}


/* EDITAR PERFIL */
async function editarPerfil(e) {
    e.preventDefault();

    const nombre = document.getElementById("edit-nombre").value.trim();
    const email = document.getElementById("edit-email").value.trim();

    if (!nombre || !email) {
        mostrarToast("Todos los campos son obligatorios", "error");
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        mostrarToast("El formato del correo no es válido", "error");
        return;
    }

    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/auth/perfil", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, email })
        });

        const data = await respuesta.json();
        mostrarToast(data.mensaje, respuesta.ok ? "success" : "error");

        if (respuesta.ok) cargarPerfil();

    } catch (error) {
        console.error("Error editando perfil:", error);
        mostrarToast("Error conectando con el servidor", "error");
    }
}


/* CAMBIAR CONTRASEÑA */
async function cambiarPassword(e) {
    e.preventDefault();

    const actual = document.getElementById("password-actual").value.trim();
    const nueva = document.getElementById("password-nueva").value.trim();
    const confirmar = document.getElementById("password-confirmar").value.trim();

    if (!actual || !nueva || !confirmar) {
        mostrarToast("Todos los campos son obligatorios", "error");
        return;
    }

    if (nueva.length < 8) {
        mostrarToast("La nueva contraseña debe tener mínimo 8 caracteres", "error");
        return;
    }

    if (nueva !== confirmar) {
        mostrarToast("Las contraseñas no coinciden", "error");
        return;
    }

    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/auth/cambiar-password", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                passwordActual: actual,
                passwordNueva: nueva
            })
        });

        const data = await respuesta.json();
        mostrarToast(data.mensaje, respuesta.ok ? "success" : "error");

        if (respuesta.ok) {
            document.getElementById("form-cambiar-password").reset();
        }

    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        mostrarToast("Error conectando con el servidor", "error");
    }
}


/* GUARDAR DIRECCIÓN DE ENVÍO */
async function guardarDireccion() {
    const direccion = document.getElementById("input-direccion")?.value.trim();
    const msgEl = document.getElementById("mensaje-direccion");

    if (!direccion) {
        if (msgEl) {
            msgEl.textContent = "Escribe una dirección primero";
            msgEl.style.color = "red";
        }
        return;
    }

    const nombre = document.getElementById("edit-nombre")?.value.trim();
    const email = document.getElementById("edit-email")?.value.trim();

    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/auth/perfil", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombre, email, direccion })
        });

        if (respuesta.ok) {
            if (msgEl) {
                msgEl.textContent = "✅ Dirección guardada correctamente.";
                msgEl.style.color = "green";
            }
        } else {
            const data = await respuesta.json();
            if (msgEl) {
                msgEl.textContent = data.mensaje || "Error al guardar";
                msgEl.style.color = "red";
            }
        }

    } catch (error) {
        if (msgEl) {
            msgEl.textContent = "Error conectando con el servidor";
            msgEl.style.color = "red";
        }
    }
}


/* CERRAR SESIÓN (LOGOUT) */
function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "Login.html";
}

/* GESTIÓN DE VISTAS DINÁMICAS */
function cambiarVista(idVista) {
    
    const vistas = document.querySelectorAll('.vista-seccion-perfil');
    vistas.forEach(v => v.classList.remove('activa'));

    const vistaSeleccionada = document.getElementById(idVista);
    if (vistaSeleccionada) {
        vistaSeleccionada.classList.add('activa');
    }

   
    const drawer = document.getElementById('perfil-drawer');
    if (drawer) drawer.classList.remove('abierto');
}