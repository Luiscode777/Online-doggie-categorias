// ==========================================================================
// CONFIGURACIÓN GLOBAL Y AUTENTICACIÓN
// ==========================================================================
// DESARROLLO LOCAL: Apunta a tu computadora
const API_BASE_URL = "http://localhost:3000/api";

// Nota: Cuando vayas a subirlo a Render, solo tendrás que cambiar la línea de arriba por la URL que te dé Render, ej:
// const API_BASE_URL = "https://tu-backend-en-render.onrender.com/api";

// Usamos el token global ya declarado en el HTML o lo recuperamos de forma segura
if (!window.token) {
    window.token = localStorage.getItem("token");
}
const accessToken = window.token;

// Utilidad global para mostrar notificaciones Toast
function mostrarToast(mensaje, tipo = "success") {
    if (typeof Toastify !== "undefined") {
        Toastify({
            text: mensaje,
            duration: 3500,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            className: tipo === "success" ? "toast-success" : "toast-error"
        }).showToast();
    } else {
        console.log(`[Toast] ${tipo}: ${mensaje}`);
    }
}

// Elementos del DOM del módulo de productos
const inputImagen = document.getElementById("imagen");
const preview = document.getElementById("preview");
const formProducto = document.getElementById("form-producto");
const uploadBox = document.getElementById("upload-box");

let productoEditando = null;
let productosCache = [];
let miGrafica = null;

// ==========================================================================
// GESTIÓN DE DRAG & DROP E IMÁGENES
// ==========================================================================
if (uploadBox && inputImagen) {
    uploadBox.addEventListener("click", () => {
        inputImagen.click();
    });
    uploadBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadBox.classList.add("dragover");
    });
    uploadBox.addEventListener("dragleave", () => {
        uploadBox.classList.remove("dragover");
    });
    uploadBox.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadBox.classList.remove("dragover");
        const archivo = e.dataTransfer.files[0];
        if (archivo) {
            inputImagen.files = e.dataTransfer.files;
            mostrarPreview(archivo);
        }
    });
}

if (inputImagen) {
    inputImagen.addEventListener("change", function () {
        const archivo = this.files[0];
        if (archivo) mostrarPreview(archivo);
    });
}

function mostrarPreview(archivo) {
    if (!preview) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
    };
    reader.readAsDataURL(archivo);
}

// ==========================================================================
// MÓDULO DE STOCK Y ALERTAS
// ==========================================================================
async function cargarAlertas() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/productos/stock-bajo`, {
            headers: { "Authorization": "Bearer " + accessToken }
        });
        const productos = await respuesta.json();
        const contenedor = document.getElementById("lista-alertas");
        if (!contenedor) return;
        if (!productos.length) {
            contenedor.innerHTML = `<p class="sin-alertas">✅ Todos los productos tienen stock suficiente.</p>`;
            return;
        }
        contenedor.innerHTML = productos.map(p => `
            <div class="alerta-item">
                <span>⚠️ <strong>${p.nombre}</strong></span>
                <span class="alerta-stock">Stock: ${p.stock} unidades</span>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error cargando alertas:", error);
    }
}

async function cargarStock() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/productos`);
        const productos = await respuesta.json();
        const contenedor = document.getElementById("lista-stock");

        if (!contenedor) return;
        contenedor.innerHTML = "";
        productos.forEach(producto => {
            contenedor.innerHTML += `
                <div class="stock-item">
                    <div class="stock-info">
                        <span class="stock-nombre">${producto.nombre}</span>
                        <span class="stock-actual ${producto.stock <= 5 ? 'stock-bajo' : ''}">
                            Stock actual: ${producto.stock}
                        </span>
                    </div>
                    <div class="stock-acciones">
                        <input type="number" id="stock-input-${producto.id}" value="${producto.stock}" min="0" class="stock-input">
                        <button onclick="actualizarStock(${producto.id})">Actualizar</button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error cargando stock:", error);
    }
}

async function actualizarStock(id) {
    const inputStock = document.getElementById(`stock-input-${id}`);
    if (!inputStock) return;

    const nuevoStock = inputStock.value;
    if (nuevoStock === "" || nuevoStock < 0) {
        Swal.fire('Cantidad incorrecta', "Ingresa un valor de stock válido", 'warning');
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/productos/${id}/stock`, {
            method: "PATCH",
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ stock: parseInt(nuevoStock) })
        });
        const data = await respuesta.json();

        if (respuesta.ok) {
            mostrarToast(data.mensaje || "Stock actualizado");
            cargarAlertas();
            cargarProductos();
        } else {
            Swal.fire('Error', data.error || "No se pudo actualizar el stock", 'error');
        }
    } catch (error) {
        console.error("Error actualizando stock:", error);
    }
}

// ==========================================================================
// MÓDULO DE PRODUCTOS (TABLA Y MANTENIMIENTO)
// ==========================================================================
async function cargarProductos() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/productos`);
        const productos = await respuesta.json();
        productosCache = productos;
        renderTablaProductos(productosCache);
    } catch (error) {
        console.error("Error cargando productos en tabla:", error);
    }
}

function renderTablaProductos(productos) {
    const tbody = document.getElementById("tabla-productos-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    productos.forEach(producto => {
        // Ajustamos las imágenes para que busquen en el backend local por ahora
        const imagenUrl = producto.imagen
            ? `http://localhost:3000/uploads/${producto.imagen}`
            : 'http://localhost:3000/uploads/ONLINE-DOGGIE ICO.ico';

        tbody.innerHTML += `
            <tr>
                <td class="td-id">#${producto.id}</td>
                <td class="td-img">
                    <img src="${imagenUrl}" alt="${producto.nombre}">
                </td>
                <td class="td-nombre">${producto.nombre}</td>
                <td class="td-desc">${producto.descripcion || 'Sin descripción'}</td>
                <td class="td-precio">$${Number(producto.precio).toLocaleString()}</td>
                <td class="td-stock">
                    <span class="${producto.stock <= 5 ? 'stock-bajo' : 'stock-ok'}">
                        ${producto.stock} uds
                    </span>
                </td>
                <td class="td-acciones">
                    <div class="tabla-botones-container">
                        <button onclick="editarProducto(${producto.id})" class="btn-tabla-editar" title="Editar">✏️</button>
                        <button onclick="eliminarProducto(${producto.id})" class="btn-tabla-eliminar" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function aplicarFiltrosTabla() {
    const inputNombre = document.getElementById("filtro-nombre");
    const inputCategoria = document.getElementById("filtro-categoria");

    const nombre = inputNombre ? inputNombre.value.trim().toLowerCase() : "";
    const categoria = inputCategoria ? inputCategoria.value : "";
    const filtrados = productosCache.filter(p => {
        const coincideNombre = p.nombre.toLowerCase().includes(nombre);
        const coincideCategoria = !categoria || Number(p.categoria_id) === Number(categoria);
        return coincideNombre && coincideCategoria;
    });
    renderTablaProductos(filtrados);
}

const filtroNombre = document.getElementById("filtro-nombre");
const filtroCategoria = document.getElementById("filtro-categoria");
if (filtroNombre) filtroNombre.addEventListener("input", aplicarFiltrosTabla);
if (filtroCategoria) filtroCategoria.addEventListener("change", aplicarFiltrosTabla);

if (formProducto) {
    formProducto.addEventListener("submit", async (e) => {
        e.preventDefault();

        const prefix = productoEditando ? "edit-" : "";

        const nombre = document.getElementById(prefix + "nombre").value.trim();
        const descripcion = document.getElementById(prefix + "descripcion").value.trim();
        const categoria = document.getElementById(prefix + "categoria").value;
        const precioRaw = document.getElementById(prefix + "precio").value;
        const stockRaw = document.getElementById(prefix + "stock").value;

        const precio = parseFloat(precioRaw.toString().replace(/[.,]/g, ""));
        const stock = parseInt(stockRaw.toString().replace(/[.,]/g, ""), 10);

        if (isNaN(precio) || isNaN(stock)) {
            Swal.fire('Datos inválidos', "El precio y el stock deben ser números válidos", 'warning');
            return;
        }

        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("descripcion", descripcion);
        formData.append("precio", precio);
        formData.append("categoria", categoria);
        formData.append("stock", stock);

        const imagenInput = document.getElementById(prefix + "imagen");
        if (imagenInput && imagenInput.files.length > 0) {
            formData.append("imagen", imagenInput.files[0]);
        }

        let url = `${API_BASE_URL}/productos`;
        let metodo = "POST";
        if (productoEditando) {
            url = `${API_BASE_URL}/productos/${productoEditando}`;
            metodo = "PUT";
        }

        try {
            const respuesta = await fetch(url, {
                method: metodo,
                headers: { "Authorization": "Bearer " + accessToken },
                body: formData
            });
            const data = await respuesta.json();

            if (respuesta.ok) {
                Swal.fire({
                    title: '¡Operación Exitosa!',
                    text: data.mensaje,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                productoEditando = null;
                formProducto.reset();
                if (preview) {
                    preview.src = "";
                    preview.style.display = "none";
                }
                const btnSubmit = document.querySelector("#form-producto button");
                if (btnSubmit) btnSubmit.innerText = "Crear Producto";

                cargarProductos();
                cargarAlertas();
                cargarMetricas();
            } else {
                Swal.fire('Error', data.error || "No se pudo procesar la solicitud", 'error');
            }
        } catch (error) {
            console.error("Error en el envío:", error);
            alert("Ocurrió un error al guardar el producto");
        }
    });
}

function editarProducto(id) {
    const producto = productosCache.find(p => Number(p.id) === Number(id));
    if (!producto) {
        alert("Producto no encontrado");
        return;
    }

    productoEditando = producto.id;

    document.getElementById("edit-nombre").value = producto.nombre;
    document.getElementById("edit-descripcion").value = producto.descripcion;
    document.getElementById("edit-precio").value = producto.precio;
    document.getElementById("edit-categoria").value = producto.categoria_id;
    document.getElementById("edit-stock").value = producto.stock;

    const previewEdit = document.getElementById("edit-preview");
    if (previewEdit) {
        if (producto.imagen) {
            previewEdit.src = `http://localhost:3000/uploads/${producto.imagen}`;
            previewEdit.style.display = "block";
        } else {
            previewEdit.src = "";
            previewEdit.style.display = "none";
        }
    }

    const editImagenInput = document.getElementById("edit-imagen");
    if (editImagenInput) editImagenInput.value = "";
    const modalEditar = document.getElementById("modal-editar");
    const overlayModal = document.getElementById("modal-editar-overlay");
    if (modalEditar) modalEditar.classList.add("activo");
    if (overlayModal) overlayModal.classList.add("activo");
}

function cerrarModalEditar() {
    const modalEditar = document.getElementById("modal-editar");
    const overlayModal = document.getElementById("modal-editar-overlay");
    if (modalEditar) modalEditar.classList.remove("activo");
    if (overlayModal) overlayModal.classList.remove("activo");
}

const btnCerrarModal = document.getElementById("cerrar-modal-editar");
const overlayModal = document.getElementById("modal-editar-overlay");
if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModalEditar);
if (overlayModal) overlayModal.addEventListener("click", cerrarModalEditar);

const formEditarProducto = document.getElementById("form-editar-producto");
if (formEditarProducto) {
    formEditarProducto.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const nombre = document.getElementById("edit-nombre").value.trim();
        const descripcion = document.getElementById("edit-descripcion").value.trim();
        const categoria = document.getElementById("edit-categoria").value;
        const precio = parseFloat(document.getElementById("edit-precio").value);
        const stock = parseInt(document.getElementById("edit-stock").value, 10);

        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("descripcion", descripcion);
        formData.append("precio", precio);
        formData.append("categoria", categoria);
        formData.append("stock", stock);

        const imagenInput = document.getElementById("edit-imagen");
        if (imagenInput && imagenInput.files.length > 0) {
            formData.append("imagen", imagenInput.files[0]);
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}/productos/${productoEditando}`, {
                method: "PUT",
                headers: { "Authorization": "Bearer " + accessToken },
                body: formData
            });
            const data = await respuesta.json();

            if (respuesta.ok) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire('¡Éxito!', 'Producto actualizado correctamente', 'success');
                }
                cerrarModalEditar(); 
                cargarProductos();
            } else {
                throw new Error(data.error || "No se pudo actualizar");
            }
        } catch (error) {
            console.error("Error al editar:", error);
            if (typeof Swal !== 'undefined') {
                Swal.fire('Error', error.message, 'error');
            } else {
                alert("Error: " + error.message);
            }
        }
    });
}

async function eliminarProducto(id) {
    Swal.fire({
        title: '¿Estás seguro de eliminar este producto?',
        text: "¡Esta acción no se puede deshacer en Online Doggie!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Sí, eliminar permanentemente',
        cancelButtonText: 'Cancelar',
        backdrop: `rgba(0, 0, 0, 0.4)`
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const respuesta = await fetch(`${API_BASE_URL}/productos/${id}`, {
                    method: "DELETE",
                    headers: { "Authorization": "Bearer " + accessToken }
                });

                const data = await respuesta.json();

                if (!respuesta.ok) {
                    Swal.fire('Error', data.error || "No se pudo eliminar el producto", 'error');
                    return;
                }

                mostrarToast(data.mensaje || "Producto eliminado correctamente");
                cargarProductos();
                cargarAlertas();
                cargarMetricas();
            } catch (error) {
                console.error("Error eliminando producto:", error);
                Swal.fire('Error de conexión', "No se pudo conectar con el servidor", 'error');
            }
        }
    });
}

async function cargarCategoriasSelect() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/categorias`);
        const categories = await respuesta.json();

        const select = document.getElementById("categoria");
        const selectEdit = document.getElementById("edit-categoria");
        const selectFiltro = document.getElementById("filtro-categoria");
        const opcionesHTML = `<option value="">Selecciona una categoría</option>` +
            categories.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");
        if (select) select.innerHTML = opcionesHTML;
        if (selectEdit) selectEdit.innerHTML = opcionesHTML;
        if (selectFiltro) {
            selectFiltro.innerHTML = `<option value="">Todas las categorías</option>` +
                categories.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }
}

// ==========================================================================
// NAVEGACIÓN Y SIDEBAR (DRAWER)
// ==========================================================================
const fab = document.getElementById("admin-fab");
const drawer = document.getElementById("admin-drawer");
const overlay = document.getElementById("drawer-overlay");
const closeDrawerBtn = document.getElementById("close-drawer");
const menuItems = document.querySelectorAll(".menu-item");
const secciones = document.querySelectorAll(".vista-seccion");

if (fab && drawer && overlay) {
    fab.addEventListener("click", () => {
        drawer.classList.add("abierto");
        overlay.classList.add("activo");
    });
}

function cerrarMenu() {
    if (drawer) drawer.classList.remove("abierto");
    if (overlay) overlay.classList.remove("activo");
}

if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", cerrarMenu);
if (overlay) overlay.addEventListener("click", cerrarMenu);

menuItems.forEach(item => {
    item.addEventListener("click", function () {
        const objetivo = this.getAttribute("data-target");
        secciones.forEach(sec => sec.classList.remove("activa"));
        const seccionObjetivo = document.getElementById(objetivo);
        if (seccionObjetivo) seccionObjetivo.classList.add("activa");
        cerrarMenu();
    });
});

// ==========================================================================
// GESTIÓN DE USUARIOS Y ROLES (ADMINISTRACIÓN)
// ==========================================================================
async function cambiarRolUsuario(accion) {
    const email = document.getElementById("admin-email").value.trim();
    if (!email) {
        mostrarToast("Por favor, ingrese el correo electrónico", "error");
        return;
    }

    const url = accion === "promover"
        ? `${API_BASE_URL}/admin/promover`
        : `${API_BASE_URL}/admin/degradar`;
    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
            mostrarToast(data.mensaje || `Rol de usuario actualizado con éxito`);
            const formAdmin = document.getElementById("form-nuevo-admin");
            if (formAdmin) formAdmin.reset();
            cargarMetricas();
        } else {
            mostrarToast(data.error || "No se pudo cambiar el rol del usuario", "error");
        }
    } catch (error) {
        console.error("Error altering rol:", error);
        mostrarToast("Error en la conexión con el servidor", "error");
    }
}

async function eliminarUsuarioSistema() {
    const email = document.getElementById("admin-email").value.trim();
    if (!email) {
        mostrarToast("Por favor, ingrese el correo electrónico del usuario a eliminar", "error");
        return;
    }

    Swal.fire({
        title: '¿Confirmas la eliminación?',
        text: `¿Está seguro de eliminar permanentemente al usuario ${email}? perderá todo acceso.`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar usuario',
        cancelButtonText: 'Conservar usuario'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const respuesta = await fetch(`${API_BASE_URL}/admin/usuarios-eliminar`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": "Bearer " + accessToken,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email: email })
                });
                const data = await respuesta.json();

                if (respuesta.ok) {
                    mostrarToast(data.mensaje || "Usuario eliminado correctamente");
                    const formAdmin = document.getElementById("form-nuevo-admin");
                    if (formAdmin) formAdmin.reset();
                    cargarMetricas();
                } else {
                    Swal.fire('Atención', data.error || "No se pudo eliminar al usuario", 'warning');
                }
            } catch (error) {
                console.error("Error eliminando usuario:", error);
                mostrarToast("Error de comunicación con el servidor", "error");
            }
        }
    });
}

// Vinculación de Event Listeners para sección de usuarios
const btnPromover = document.getElementById("btn-promover");
const btnDegradar = document.getElementById("btn-degradar");
const btnEliminar = document.getElementById("btn-eliminar");
if (btnPromover) btnPromover.addEventListener("click", () => cambiarRolUsuario("promover"));
if (btnDegradar) btnDegradar.addEventListener("click", () => cambiarRolUsuario("degradar"));
if (btnEliminar) btnEliminar.addEventListener("click", eliminarUsuarioSistema);

// ==========================================================================
// MÓDULO OPTIMIZADO: HISTORIAL DE COMPRAS DE USUARIOS
// ==========================================================================
function inicializarHistorialCompras() {
    const btnBuscarHistorial = document.getElementById('btn-buscar-historial');
    const inputEmailHistorial = document.getElementById('buscar-historial-email');
    const contenedorHistorial = document.getElementById('resultados-historial-compras');

    if (!btnBuscarHistorial || !inputEmailHistorial || !contenedorHistorial) return;
    btnBuscarHistorial.addEventListener('click', async () => {
        const email = inputEmailHistorial.value.trim();
        if (!email) {
            mostrarToast("Por favor, ingrese un correo electrónico para buscar.", "error");
            return;
        }

        contenedorHistorial.innerHTML = '<p class="historial-vacio">🔍 Buscando transacciones...</p>';

        try {
            const respuesta = await fetch(`${API_BASE_URL}/pedidos?email=${encodeURIComponent(email)}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${accessToken}` }
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                contenedorHistorial.innerHTML = `<p class="historial-error">❌ ${datos.error || 'Error en la consulta.'}</p>`;
                return;
            }

            if (datos.length === 0) {
                contenedorHistorial.innerHTML = '<p class="historial-vacio">📦 El usuario no registra órdenes de compra.</p>';
                return;
            }

            contenedorHistorial.innerHTML = "";
            datos.forEach(compra => {
                const fechaFormateada = new Date(compra.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const card = document.createElement('div');
                card.className = 'historial-item-card';

                const header = document.createElement('div');
                header.className = 'historial-item-header';

                const spanId = document.createElement('span');
                spanId.className = 'historial-id';
                spanId.textContent = `Orden #${compra.id}`;

                const spanMonto = document.createElement('span');
                spanMonto.className = 'historial-monto';
                spanMonto.textContent = `$${Number(compra.total).toLocaleString('es-CO')}`;

                header.appendChild(spanId);
                header.appendChild(spanMonto);

                const detalles = document.createElement('div');
                detalles.className = 'historial-item-detalles';

                const spanFecha = document.createElement('span');
                spanFecha.textContent = `📅 ${fechaFormateada}`;

                const spanEstado = document.createElement('span');
                spanEstado.innerHTML = `📦 Estado: <strong class="badge-${compra.estado}">${compra.estado.toUpperCase()}</strong>`;

                detalles.appendChild(spanFecha);
                detalles.appendChild(spanEstado);

                if (compra.productos && compra.productos.length > 0) {
                    const divProductos = document.createElement('div');
                    divProductos.className = 'historial-item-productos';
                    divProductos.style.marginTop = '8px';
                    divProductos.style.fontSize = '0.85rem';
                    divProductos.style.color = '#555';

                    let textoProductos = "<strong>Artículos:</strong> ";
                    textoProductos += compra.productos.map(p => `${p.nombre} (x${p.cantidad})`).join(', ');
                    divProductos.innerHTML = textoProductos;

                    detalles.appendChild(divProductos);
                }

                card.appendChild(header);
                card.appendChild(detalles);
                contenedorHistorial.appendChild(card);
            });
        } catch (error) {
            console.error("Error buscando historial:", error);
            contenedorHistorial.innerHTML = '<p class="historial-error">⚠️ Conexión fallida con la API.</p>';
        }
    });
}

// ==========================================================================
// DASHBOARD: MÉTRICAS Y GRÁFICOS (CHART.JS)
// ==========================================================================
async function cargarMetricas() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/admin/metricas`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });
        const data = await respuesta.json();

        if (respuesta.ok) {
            const metProductos = document.getElementById('met-productos');
            const metUsuarios = document.getElementById('met-usuarios');
            const metVentas = document.getElementById('met-ventas');

            if (metProductos) metProductos.textContent = data.totalProductos;
            if (metUsuarios) metUsuarios.textContent = data.totalUsuarios;
            if (metVentas) {
                metVentas.textContent = Number(data.totalVentas).toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                });
            }

            const ctx = document.getElementById('graficaMetricas')?.getContext('2d');
            if (!ctx) return;
            if (miGrafica) miGrafica.destroy();

            miGrafica = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Productos Activos', 'Usuarios Registrados', 'Ventas Procesadas'],
                    datasets: [{
                        label: 'Dashboard de Rendimiento',
                        data: [data.totalProductos, data.totalUsuarios, data.totalVentas / 100000],
                        backgroundColor: ['rgba(30, 60, 255, 0.75)', 'rgba(0, 180, 230, 0.75)', 'rgba(16, 185, 129, 0.75)'],
                        borderColor: ['#1E3CFF', '#00B4E6', '#10B981'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    } catch (error) {
        console.error("Error cargando métricas:", error);
    }
}

// ==========================================================================
// MÓDULO DE PEDIDOS GENERALES (TABLA GLOBAL)
// ==========================================================================
async function cargarPedidos() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/pedidos`, {
            headers: { Authorization: "Bearer " + accessToken }
        });
        const datosOriginales = await respuesta.json();
        const contenedor = document.getElementById("lista-pedidos-admin");
        if (!contenedor) return;
        if (datosOriginales.length === 0) {
            contenedor.innerHTML = `<p style="padding: 20px; color: #718096; text-align: center;">No hay pedidos registrados.</p>`;
            return;
        }

        const pedidosAgrupados = Object.values(datosOriginales.reduce((acumulador, item) => {
            if (!acumulador[item.id]) {
                acumulador[item.id] = {
                    id: item.id,
                    nombre: item.nombre,
                    email: item.email,
                    total: item.total,
                    estado: item.estado,
                    productos: []
                };
            }
            if (item.producto_nombre) {
                acumulador[item.id].productos.push({
                    nombre: item.producto_nombre,
                    cantidad: item.cantidad
                });
            }
            return acumulador;
        }, {}));
        contenedor.innerHTML = "";
        pedidosAgrupados.forEach(pedido => {
            const card = document.createElement("div");
            card.className = "pedido-card";
            
            let productosHTML = pedido.productos.map(p => `<li>${p.nombre} x${p.cantidad}</li>`).join("");

            card.innerHTML = `
                <div class="pedido-header">
                    <h4>Pedido #${pedido.id} - ${pedido.nombre}</h4>
                    <span class="pedido-email">${pedido.email}</span>
                </div>
                <div class="pedido-body">
                    <ul>${productosHTML}</ul>
                    <p class="pedido-total">Total: <strong>$${Number(pedido.total).toLocaleString('es-CO')}</strong></p>
                </div>
                <div class="pedido-acciones">
                    <select id="estado-${pedido.id}" class="select-estado">
                        <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="enviado" ${pedido.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
                        <option value="entregado" ${pedido.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                    <button onclick="actualizarEstadoPedido(${pedido.id})" class="btn-actualizar-pedido">Cambiar Estado</button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error cargando pedidos globales:", error);
    }
}

async function actualizarEstadoPedido(id) {
    const select = document.getElementById(`estado-${id}`);
    if (!select) return;
    try {
        const respuesta = await fetch(`${API_BASE_URL}/pedidos/${id}/estado`, {
            method: "PATCH",
            headers: {
                "Authorization": "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado: select.value })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
            mostrarToast(data.mensaje || "Estado de pedido actualizado correctamente");
            cargarPedidos();
            cargarMetricas();
        } else {
            Swal.fire('Error', data.error || "No se pudo cambiar el estado", 'error');
        }
    } catch (error) {
        console.error("Error modificando estado pedido:", error);
    }
}

// ==========================================================================
// CONTROLADOR INTERNO DE CATEGORÍAS (MÓDULO EXCLUSIVO)
// ==========================================================================
const tablaCatBody = document.getElementById('tabla-categorias-admin-body');
const formCat = document.getElementById('form-categoria-admin');
const inputCatNombre = document.getElementById('input-categoria-nombre');
async function consultarCategoriasAdmin() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/categorias`);
        const listaCategorias = await respuesta.json();
        
        if (!tablaCatBody) return;
        tablaCatBody.innerHTML = '';
        if (!listaCategorias || listaCategorias.length === 0) {
            tablaCatBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#718096;">No hay categorías registradas aún.</td></tr>`;
            return;
        }

        listaCategorias.forEach(cat => {
            tablaCatBody.innerHTML += `
                <tr>
                    <td class="td-id">#${cat.id}</td>
                    <td style="font-size: 1rem; font-weight: 500; color: #2d3748; padding: 12px;">${cat.nombre}</td>
                    <td style="text-align: center;">
                        <button onclick="eliminarCategoriaAdmin(${cat.id})" style="background-color: #EF4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem; text-transform: uppercase; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#DC2626'" onmouseout="this.style.backgroundColor='#EF4444'">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error al renderizar categorías en el panel:", error);
    }
}

if (formCat) {
    formCat.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = inputCatNombre.value.trim();

        try {
            const res = await fetch(`${API_BASE_URL}/categorias`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
                body: JSON.stringify({ nombre })
            });

            const datos = await res.json();

            if (!res.ok) {
                Swal.fire('Atención', datos.error || "Error al guardar la categoría", 'warning');
            } else {
                mostrarToast("✅ Categoría registrada con éxito en Online Doggie");
                inputCatNombre.value = '';
                consultarCategoriasAdmin();
                cargarCategoriasSelect(); 
            }
        } catch (error) {
            Swal.fire('Error de red', "Fallo al conectar con el servidor.", 'error');
        }
    });
}

window.eliminarCategoriaAdmin = async (id) => {
    Swal.fire({
        title: '¿Remover categoría?',
        text: "¿Estás completamente segura de remover esta categoría del sistema?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Sí, remover',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/categorias/${id}`, { 
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + accessToken }
                });
                const datos = await res.json();

                if (res.ok) {
                    mostrarToast(datos.mensaje || "Categoría eliminada limpiamente.");
                    consultarCategoriasAdmin();
                    cargarCategoriasSelect();
                } else {
                    Swal.fire('Restricción de integridad', datos.error || "No se puede eliminar la categoría porque hay productos vinculados a ella.", 'error');
                }
            } catch (error) {
                mostrarToast("Fallo crítico al procesar la eliminación.", "error");
            }
        }
    });
};

// ==========================================================================
// CARGA INICIAL COMPLETA (DOM CONTENT LOADED)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    cargarMetricas();
    cargarAlertas();
    cargarProductos();
    cargarCategoriasSelect();
    cargarPedidos();
    inicializarHistorialCompras();
    consultarCategoriasAdmin(); 
});