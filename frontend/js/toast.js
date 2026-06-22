/* SISTEMA DE NOTIFICACIONES GLOBALES (TOAST) */
function mostrarToast(mensaje, tipo = 'success', subtexto = '') {
    const toast = document.createElement('div');
    toast.className = `toast-online-doggie ${tipo}`;

    
    let icono = '✅'; 
    if (tipo === 'error') {
        icono = '❌';
    } else if (mensaje.toLowerCase().includes('correo') || mensaje.toLowerCase().includes('registro')) {
        icono = '📧';
       
        if (!subtexto) subtexto = 'Revisa tu bandeja de entrada 🐾';
    }

    toast.innerHTML = `
        <span class="icono">${icono}</span>
        <div>
            <div class="toast-mensaje">${mensaje}</div>
            ${subtexto ? `<div class="subtexto">${subtexto}</div>` : ''}
        </div>
    `;

    document.body.appendChild(toast);

    
    setTimeout(() => {
        toast.remove();
    }, 4500);
}