const token = localStorage.getItem("token"); 

document.addEventListener("DOMContentLoaded", () => {
    
    if (!token) {
        if (typeof mostrarToast === "function") {
            mostrarToast("Debes iniciar sesión para ver tu historial", "error");
        }
        
       
        setTimeout(() => {
            window.location.href = "login.html"; 
        }, 2000);
        return;
    }
    
    cargarPedidosDelUsuario();
});

async function cargarPedidosDelUsuario() {
    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/pedidos/mis-pedidos", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const pedidos = await respuesta.json();

        if (respuesta.ok) {
            renderizarHistorial(pedidos);
        } else {
            console.error("Error al traer pedidos:", pedidos.error);
            if (typeof mostrarToast === "function") {
                mostrarToast("No se pudieron cargar tus pedidos", "error");
            }
        }
    } catch (error) {
        console.error("Error de red:", error);
        if (typeof mostrarToast === "function") {
            mostrarToast("Error de conexión con el servidor", "error");
        }
    }
}

function renderizarHistorial(pedidos) {
    const contenedor = document.getElementById("historial-contenedor");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";

    if (pedidos.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; padding:2rem;'>Aún no has realizado ninguna compra de Online Doggie 🐾</p>";
        return;
    }

    pedidos.forEach(pedido => {
        const botonConfirmar = pedido.estado === 'enviado' 
            ? `<button class="btn-confirmar-recibido" onclick="marcarComoRecibido(${pedido.id})">✅ Ya recibí mi pedido</button>`
            : '';

        contenedor.innerHTML += `
            <div class="tarjeta-pedido">
                <p><strong>Pedido #${pedido.id}</strong> - Total: $${Number(pedido.total).toLocaleString('es-CO')} COP</p>
                <p>Estado: <span class="badge-${pedido.estado}">${pedido.estado}</span></p>
                ${botonConfirmar}
            </div>
        `;
    });
}


/*CONFIRMAR RECEPCIÓN DEL PEDIDO */
async function marcarComoRecibido(pedidoId) {
   
    if (!confirm("¿Confirmas que ya tienes el pedido en tus manos?")) return;

    try {
        const respuesta = await fetch(`https://online-doggie-backend-production.up.railway.app/api/pedidos/${pedidoId}/recibido`, {
            method: "PATCH",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            if (typeof mostrarToast === "function") {
                mostrarToast(data.error || "No se pudo actualizar el estado", "error");
            }
            return;
        }

        if (typeof mostrarToast === "function") {
            mostrarToast(data.mensaje || "¡Pedido confirmado como recibido!", "success");
        }
        
        cargarPedidosDelUsuario(); 

    } catch (error) {
        console.error("Error al confirmar entrega:", error);
        if (typeof mostrarToast === "function") {
            mostrarToast("Error al conectar con el servidor", "error");
        }
    }
}