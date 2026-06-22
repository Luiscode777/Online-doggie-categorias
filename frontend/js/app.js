/* CONFIGURACIÓN DE URL */
const API_BASE_URL = "https://online-doggie-categorias.onrender.com";

/* HISTORIAL NAVEGACIÓN */
function registrarNavegacion(producto) {
    let historial = JSON.parse(localStorage.getItem("historial-nav")) || [];

    const existe = historial.find(p => p.id === producto.id);
    if (!existe) {
        historial.unshift(producto);
        if (historial.length > 6) historial = historial.slice(0, 6);
        localStorage.setItem("historial-nav", JSON.stringify(historial));
    }
}

function mostrarHistorialNav() {
    const historial = JSON.parse(localStorage.getItem("historial-nav")) || [];
    const seccion   = document.getElementById("seccion-historial-nav");
    const lista     = document.getElementById("historial-nav-lista");

    if (!historial.length || !seccion) return;

    seccion.style.display = "block";
    lista.innerHTML = "";

    historial.forEach(producto => {
        const div = document.createElement("div");
        div.classList.add("producto");
        div.innerHTML = `
            <img src="${API_BASE_URL}/assets/img/${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p class="precio">$${Number(producto.precio).toLocaleString("es-CO")}</p>
            <a href="productos.html" class="btn-agregar">Ver productos</a>
        `;
        lista.appendChild(div);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    mostrarHistorialNav();
});

/* CALIFICACIÓN SERVICIO */
let calificacionSeleccionada = 0;

function seleccionarCalificacion(valor) {
    calificacionSeleccionada = valor;
    const estrellas = document.querySelectorAll(".estrella-servicio");
    estrellas.forEach((estrella, index) => {
        estrella.textContent = index < valor ? "⭐" : "☆";
    });
}

function enviarCalificacion() {
    const mensaje = document.getElementById("mensaje-calificacion");

    if (!calificacionSeleccionada) {
        mensaje.textContent = "Selecciona una calificación";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = `✅ Gracias por tu calificación de ${calificacionSeleccionada} estrellas`;
    mensaje.style.color = "green";
    calificacionSeleccionada = 0;

    const estrellas = document.querySelectorAll(".estrella-servicio");
    estrellas.forEach(e => e.textContent = "☆");
}

/* FORMULARIO CONTACTO */
document.getElementById("form-contacto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre  = document.getElementById("contacto-nombre").value.trim();
    const email   = document.getElementById("contacto-email").value.trim();
    const mensaje = document.getElementById("contacto-mensaje").value.trim();
    const msgEl   = document.getElementById("mensaje-contacto");

    if (!nombre || !email || !mensaje) {
        msgEl.textContent = "Todos los campos son obligatorios";
        msgEl.style.color = "red";
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        msgEl.textContent = "El formato del correo no es válido";
        msgEl.style.color = "red";
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/contacto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, mensaje })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            msgEl.textContent = "✅ Mensaje enviado. Te responderemos pronto.";
            msgEl.style.color = "green";
            document.getElementById("form-contacto").reset();
        } else {
            msgEl.textContent = data.mensaje || "Error al enviar mensaje";
            msgEl.style.color = "red";
        }
    } catch (error) {
        msgEl.textContent = "Error conectando con el servidor";
        msgEl.style.color = "red";
    }
});

/* BOLETÍN DE NOTICIAS */
document.getElementById("form-boletin").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("boletin-email").value.trim();
    const msgEl = document.getElementById("mensaje-boletin");

    if (!email) {
        msgEl.textContent = "Ingresa tu correo";
        msgEl.style.color = "red";
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
        msgEl.textContent = "El formato del correo no es válido";
        msgEl.style.color = "red";
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/api/boletin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            msgEl.textContent = "✅ Suscripción confirmada. ¡Gracias!";
            msgEl.style.color = "green";
            document.getElementById("form-boletin").reset();
        } else {
            msgEl.textContent = data.mensaje || "Error al suscribirse";
            msgEl.style.color = "red";
        }
    } catch (error) {
        msgEl.textContent = "Error conectando con el servidor";
        msgEl.style.color = "red";
    }
});