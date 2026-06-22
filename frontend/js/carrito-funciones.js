function agregarAlCarrito(id, nombre, precio, boton) {

    const productoDiv = boton.closest(".producto");

    if (!productoDiv) return;

    const imagenElement = productoDiv.querySelector("img");
    const imagen = imagenElement ? imagenElement.src : "";

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const productoExistente = carrito.find(p => p.id === id);

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            id,
            nombre,
            precio,
            imagen,
            cantidad: 1
        });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));

    actualizarContador();

    if (typeof abrirMiniCarrito === "function") {
        abrirMiniCarrito();
    }
}