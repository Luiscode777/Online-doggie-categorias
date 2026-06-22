const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function formatCurrency(amount) {
  return `$${Number(amount).toLocaleString('es-CO')} COP`;
}

function formatDate(date) {
  return new Date(date).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });
}


function buildItemsTable(items) {
  const rows = (items || []).map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:10px;">
        ${item.image 
          ? `<img src="${item.image}" alt="${item.name}" 
               style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #e0f0ff;" 
               onerror="this.style.display='none'">` 
          : '<div style="width:48px;height:48px;background:#F4FAFF;border-radius:8px;border:1px solid #e0f0ff;"></div>'}
        <strong>${item.name}</strong>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatCurrency(item.price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1E3CFF;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#F4FAFF;">
          <th style="padding:10px 12px;text-align:left;color:#1E3CFF;font-size:13px;">Producto</th>
          <th style="padding:10px 12px;text-align:center;color:#1E3CFF;font-size:13px;">Cant.</th>
          <th style="padding:10px 12px;text-align:right;color:#1E3CFF;font-size:13px;">Precio</th>
          <th style="padding:10px 12px;text-align:right;color:#1E3CFF;font-size:13px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}


function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4FAFF;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,60,255,0.10);">
    <div style="background:linear-gradient(135deg,#1E3CFF 0%,#00B4E6 100%);padding:28px 32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:6px;">🐾</div>
      <div style="color:#fff;font-size:22px;font-weight:700;">Online Doggie</div>
      <div style="color:#e0f0ff;font-size:13px;margin-top:4px;">Todo para tu mejor amigo</div>
    </div>
    <div style="padding:32px;">${content}</div>
    <div style="background:#F4FAFF;padding:20px 32px;text-align:center;border-top:1px solid #e0f0ff;">
      <p style="color:#00B4E6;font-size:12px;margin:0;">
        ¿Dudas? Escríbenos a <a href="mailto:${process.env.EMAIL_USER}" style="color:#1E3CFF;">${process.env.EMAIL_USER}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// CORREO 1 - CLIENTE (QR PAGO)
async function sendPaymentQRToClient({ order, qrBase64, paymentInfo }) {
  const destinatario = (order.user_email || "").trim();

  if (!destinatario) {
    throw new Error("No recipients defined");
  }

  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "");

  const content = `
    <h2>🛒 Pedido recibido</h2>
    <p>Hola <strong>${order.user_name}</strong></p>

    <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>

    <h3>Cómo pagar</h3>
    <p>Referencia: ${paymentInfo?.concepto || ""}</p>

    <div style="text-align:center;margin:20px 0;">
      <img src="cid:qr_pago" style="width:220px;height:220px;" />
    </div>

    <div style="text-align:center;margin:25px 0;">
      <p style="color:#4a5568;font-size:14px;margin-bottom:12px;">Una vez realices la transferencia, envíanos tu comprobante haciendo clic aquí:</p>
      <a href="${order.whatsappUrl}" target="_blank" style="display:inline-block;background-color:#25D366;color:#ffffff;text-decoration:none;padding:12px 28px;font-weight:700;border-radius:30px;font-size:14px;box-shadow:0 4px 12px rgba(37,211,102,0.15);">
        💬 Enviar Comprobante por WhatsApp
      </a>
    </div>

    ${buildItemsTable(order.items)}
  `;

  await createTransporter().sendMail({
    from: `"🐾 Online Doggie" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: `Pedido #${shortId} — Pago`,
    html: emailWrapper(content),
    attachments: [
      {
        filename: "qr_pago.png",
        content: base64Data,
        encoding: "base64",
        cid: "qr_pago"
      }
    ]
  });
}

// CORREO 2 - ADMIN
async function sendNewOrderToAdmin({ order }) {
  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim();

  if (!adminEmail) {
    console.warn("ADmIN_EMAIL no definido, no se enviará correo al admin");
    return;
  }

  await createTransporter().sendMail({
    from: `"🐾 Online Doggie" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Nuevo pedido #${shortId}`,
    html: emailWrapper(`
      <h2>Nuevo pedido</h2>
      <p>Cliente: ${order.user_name}</p>
      <p>Email: ${order.user_email}</p>
      ${buildItemsTable(order.items)}
    `),
  });
}

// CORREO 3 - ENVÍO
async function sendShippingConfirmationToClient({ order }) {
  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const destinatario = (order.user_email || "").trim();

  if (!destinatario) return;

  await createTransporter().sendMail({
    from: `"🐾 Online Doggie" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: `Tu pedido #${shortId} fue enviado`,
    html: emailWrapper(`<h2>🚚 Pedido enviado</h2>`),
  });
}

// CORREO 4 - ENTREGA
async function sendDeliveryConfirmationToClient({ order }) {
  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const destinatario = (order.user_email || "").trim();

  if (!destinatario) return;

  await createTransporter().sendMail({
    from: `"🐾 Online Doggie" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: `Pedido #${shortId} entregado`,
    html: emailWrapper(`<h2>🎉 Entrega confirmada</h2>`),
  });
}

module.exports = {
  sendPaymentQRToClient,
  sendNewOrderToAdmin,
  sendShippingConfirmationToClient,
  sendDeliveryConfirmationToClient,
};