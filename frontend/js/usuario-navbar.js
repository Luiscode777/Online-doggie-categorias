document.addEventListener("DOMContentLoaded", () => {
   
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;
    
    const paginasPrivadas = ["perfil.html", "carrito.html", "admin.html"];
    const esPaginaPrivada = paginasPrivadas.some(pagina => currentPath.includes(pagina));

    if (esPaginaPrivada && !token) {
        localStorage.clear();
        window.location.replace("login.html");
        return; 
    }

    cargarUsuario();
});


/* RENDERS Y PETICIONES PRINCIPALES */
async function cargarUsuario() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const navbar = document.querySelector(".navbar ul");
    const loginBtn = document.querySelector(".btn-login");
    if (!navbar) return;

    const currentPath = window.location.pathname;
    const paginasPrivadas = ["perfil.html", "carrito.html", "admin.html"];
    const esPaginaPrivada = paginasPrivadas.some(pagina => currentPath.includes(pagina));

    try {
        const respuesta = await fetch("https://online-doggie-categorias.onrender.com/api/auth/perfil", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            
            if (esPaginaPrivada) {
                window.location.replace("login.html");
            }
            return;
        }

        const usuario = await respuesta.json();

        if (currentPath.includes("admin.html") && usuario.rol !== "admin") {
            window.location.replace("index.html");
            return;
        }

        if (loginBtn) loginBtn.remove();

        document.querySelectorAll(".usuario-navbar-item").forEach(el => el.remove());

        const liPerfilText = document.createElement("li");
        liPerfilText.classList.add("usuario-navbar-item");
        liPerfilText.innerHTML = `<a href="perfil.html">Mi Perfil</a>`;
        navbar.appendChild(liPerfilText);

        const liUsuario = document.createElement("li");
        liUsuario.classList.add("usuario-navbar-item");
        liUsuario.innerHTML = `
            <a href="perfil.html">
                👤 ${usuario.nombre}
            </a>
        `;
        navbar.appendChild(liUsuario);

        if (usuario.rol === "admin") {
            const liAdmin = document.createElement("li");
            liAdmin.classList.add("usuario-navbar-item");
            liAdmin.innerHTML = `<a href="admin.html">Panel Admin</a>`;
            navbar.appendChild(liAdmin);
        }

        const liLogout = document.createElement("li");
        liLogout.classList.add("usuario-navbar-item");
        liLogout.innerHTML = `<a href="#" id="logout-btn">Cerrar sesión</a>`;
        navbar.appendChild(liLogout);

        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", ejecutarLogout);
        }

    } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
    }
}


/* ACCIONES DE USUARIO */
function ejecutarLogout(e) {
    e.preventDefault();

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    if (typeof mostrarToast === "function") {
        mostrarToast("Sesión cerrada correctamente. ¡Vuelve pronto! 🐾", "success");
    }

    setTimeout(() => {
        window.location.replace("index.html");
    }, 1000);
}