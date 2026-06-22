const token = localStorage.getItem("token");

if (!token) {
    
    window.location.href = "login.html";
} else {
    
    verificarSesion();
}

async function verificarSesion() {
    try {
        const respuesta = await fetch("https://online-doggie-backend-production.up.railway.app/api/auth/perfil", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!respuesta.ok) {
            
            localStorage.removeItem("token");
            window.location.href = "login.html";
        }
    } catch (error) {
        
        localStorage.removeItem("token");
        console.error("Error verificando sesión en el servidor:", error);
        window.location.href = "login.html";
    }
}
