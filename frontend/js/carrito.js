document.addEventListener("DOMContentLoaded", function () {
    mostrarCarrito();
    actualizarMiniCarrito();
    actualizarContador();

    const botonCerrar = document.getElementById("cerrar-mini");
    if (botonCerrar) botonCerrar.addEventListener("click", cerrarMiniCarrito);

    const overlay = document.getElementById("overlay-mini");
    if (overlay) overlay.addEventListener("click", cerrarMiniCarrito);
});

let descuentoAplicado = 0;

/* FUNCIONES AUXILIARES */

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

/* CARRITO PRINCIPAL */

function mostrarCarrito() {
    let carrito = obtenerCarrito();
    let carritoBody = document.getElementById("carrito-body");
    let total = 0;

    if (!carritoBody) return;

    carritoBody.innerHTML = "";

    if (carrito.length === 0) {
        carritoBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:20px;">
                    Tu carrito está vacío
                </td>
            </tr>
        `;
    }

    carrito.forEach((producto, index) => {
        let subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        carritoBody.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>$${Number(producto.precio).toLocaleString("es-CO")}</td>
                <td>${producto.cantidad}</td>
                <td>$${subtotal.toLocaleString("es-CO")}</td>
                <td><button onclick="eliminarProducto(${index})">❌</button></td>
            </tr>
        `;
    });

    const totalConDescuento = total - (total * descuentoAplicado / 100);
    const totalElemento = document.getElementById("total");

    if (totalElemento) {
        totalElemento.innerText = descuentoAplicado > 0
            ? `Total: $${totalConDescuento.toLocaleString("es-CO")} (${descuentoAplicado}% de descuento aplicado)`
            : `Total: $${total.toLocaleString("es-CO")}`;
    }
}

function eliminarProducto(index) {
    let carrito = obtenerCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);

    mostrarCarrito();
    actualizarMiniCarrito();
    actualizarContador();
}

function vaciarCarrito() {
    localStorage.removeItem("carrito");
    descuentoAplicado = 0;

    mostrarCarrito();
    actualizarMiniCarrito();
    actualizarContador();
}

/* SISTEMA DE ALERTAS (TOAST) */
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.innerHTML = `
        <div style="
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 9999;
            background: ${tipo === 'success' 
                ? 'linear-gradient(135deg, #1E3CFF, #00B4E6)' 
                : 'linear-gradient(135deg, #EF4444, #DC2626)'};
            color: white;
            padding: 18px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(30, 60, 255, 0.3);
            font-family: 'Oswald', sans-serif;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 320px;
            animation: slideIn 0.4s ease;
        ">
            <span style="font-size: 26px;">${tipo === 'success' ? '📧' : '❌'}</span>
            <div>
                <div style="font-size: 17px;">${mensaje}</div>
                ${tipo === 'success' ? '<div style="font-size: 13px; opacity: 0.85; margin-top: 4px; font-weight: normal;">Revisa tu bandeja de entrada 🐾</div>' : ''}
            </div>
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

/* CUPÓN DE DESCUENTO */

const cupones = {
    "DOGGIE10": 10,
    "DOGGIE20": 20,
    "BIENVENIDO": 15
};

function aplicarCupon() {
    const codigo = document.getElementById("input-cupon").value.trim().toUpperCase();
    const mensaje = document.getElementById("mensaje-cupon");

    if (!mensaje) return;

    if (!codigo) {
        mensaje.textContent = "Ingresa un código de cupón";
        mensaje.style.color = "red";
        return;
    }

    if (cupones[codigo]) {
        descuentoAplicado = cupones[codigo];
        mensaje.textContent = `✅ Cupón aplicado: ${descuentoAplicado}% de descuento`;
        mensaje.style.color = "green";
        mostrarCarrito();
    } else {
        descuentoAplicado = 0;
        mensaje.textContent = "❌ Código inválido";
        mensaje.style.color = "red";
    }
}

/* MINI CARRITO */

function abrirMiniCarrito() {
    document.getElementById("mini-carrito")?.classList.add("activo");
    document.getElementById("overlay-mini")?.classList.add("activo");
    actualizarMiniCarrito();
}

function cerrarMiniCarrito() {
    document.getElementById("mini-carrito")?.classList.remove("activo");
    document.getElementById("overlay-mini")?.classList.remove("activo");
}

function actualizarMiniCarrito() {
    let carrito = obtenerCarrito();
    let contenedor = document.getElementById("mini-carrito-body");
    let total = 0;

    if (!contenedor) return;
    contenedor.innerHTML = "";

    carrito.forEach((producto, index) => {
        let subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const rutaImagen = (producto.imagen && producto.imagen.startsWith("http"))
            ? producto.imagen
            : `https://online-doggie-categorias.onrender.com/uploads/${producto.imagen}`;

        contenedor.innerHTML += `
            <div class="mini-item">
                <img src="${rutaImagen}" class="mini-img" alt="${producto.nombre}">
                <div class="mini-info">
                    <h4>${producto.nombre}</h4>
                    <p>Cantidad: ${producto.cantidad}</p>
                    <p class="mini-precio">$${subtotal.toLocaleString("es-CO")}</p>
                </div>
                <button class="mini-eliminar" onclick="eliminarDesdeMini(${index})">✕</button>
            </div>
        `;
    });

    const totalMini = document.getElementById("mini-total");
    if (totalMini) {
        totalMini.innerText = "Total: $" + total.toLocaleString("es-CO");
    }
}

function eliminarDesdeMini(index) {
    let carrito = obtenerCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);

    actualizarMiniCarrito();
    actualizarContador();
    mostrarCarrito();
}

function actualizarContador() {
    let carrito = obtenerCarrito();
    let totalCantidad = 0;

    carrito.forEach(producto => {
        totalCantidad += producto.cantidad;
    });

    const contador = document.getElementById("contador-carrito");
    if (contador) {
        contador.innerText = totalCantidad;
    }
}

/* FINALIZAR COMPRA */

async function finalizarCompra() {
    const token = localStorage.getItem("token");

    if (!token) {
        
        mostrarToast("Debes iniciar sesión para comprar", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
        return;
    }

    const carrito = obtenerCarrito();

    if (!carrito.length) {
       
        mostrarToast("Tu carrito está vacío para procesar un pedido", "error");
        return;
    }

    try {
        const respuesta = await fetch("https://online-doggie-categorias.onrender.com/api/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ carrito })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            console.error(data);
            mostrarToast(data.mensaje || data.error || 'Error al procesar pedido', 'error');
            return;
        }

        
        mostrarToast('¡Pedido creado! Verifica tu correo para procesar el pago', 'success');

        localStorage.removeItem("carrito");
        mostrarCarrito();
        actualizarContador();
        actualizarMiniCarrito();

    } catch (err) {
        console.error(err);
        mostrarToast('Error de servidor al conectar con la API', 'error');
    }
}