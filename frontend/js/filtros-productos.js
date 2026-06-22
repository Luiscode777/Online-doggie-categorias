document.addEventListener("DOMContentLoaded", () => {

   
    const buscador = document.getElementById("buscador");
    const filtroCategoria = document.getElementById("categoria");

    
    if (!buscador || !filtroCategoria) return;


    /* LÓGICA PRINCIPAL DE FILTRADO */
    function filtrarProductos() {
        const texto = buscador.value.toLowerCase();
        const categoria = filtroCategoria.value.toLowerCase(); 
        const productos = document.querySelectorAll(".producto");
        
        let hayResultados = false;

        // Evaluar coincidencia de cada producto del DOM
        productos.forEach(producto => {
            const nombre = (producto.dataset.nombre || "").toLowerCase();
            const categoriaProducto = (producto.dataset.categoria || "").toLowerCase();

            const coincideTexto = nombre.includes(texto);
            const coincideCategoria = categoria === "todos" || categoriaProducto === categoria;

            if (coincideTexto && coincideCategoria) {
                producto.style.display = "block";
                hayResultados = true;
            } else {
                producto.style.display = "none";
            }
        });

        gestionarMensajeVacio(hayResultados, categoria, texto);
    }


    /* CONTROL DEL MENSAJE DE SIN RESULTADOS */
    function gestionarMensajeVacio(hayResultados, categoria, texto) {
        let mensaje = document.getElementById("mensaje-sin-resultados");
        const listaProductos = document.getElementById("lista-productos");

        
        if (!mensaje && listaProductos) {
            mensaje = document.createElement("p");
            mensaje.id = "mensaje-sin-resultados";
            mensaje.style.textAlign = "center";
            mensaje.style.color = "var(--color-text-secondary, #888)";
            mensaje.style.padding = "2rem";
            mensaje.style.width = "100%";
            listaProductos.appendChild(mensaje);
        }

        if (!mensaje) return; 

       
        if (!hayResultados) {
            mensaje.textContent = (categoria !== "todos" && texto === "")
                ? "No hay productos en la categoría seleccionada."
                : `No se encontraron productos para "${buscador.value}".`;
            mensaje.style.display = "block";
        } else {
            mensaje.style.display = "none";
        }
    }

    buscador.addEventListener("input", filtrarProductos);
    filtroCategoria.addEventListener("change", filtrarProductos);

});