const QRCode = require('qrcode');

async function generatePaymentQR({ orderId, total }) {
  const paymentInfo = {
    banco: process.env.BANK_NAME,
    cuenta: process.env.ACCOUNT_NUMBER,
    titular: process.env.ACCOUNT_HOLDER,
    tipo: process.env.ACCOUNT_TYPE,
    monto: `$${Number(total).toLocaleString('es-CO')} COP`,
    pedidoId: orderId,
    concepto: `Pedido #${String(orderId).slice(0, 8).toUpperCase()}`,
  };

  const qrText = `
PAGO ONLINE DOGGIE
Banco: ${paymentInfo.banco}
Cuenta: ${paymentInfo.cuenta}
Titular: ${paymentInfo.titular}
Monto: ${paymentInfo.monto}
Referencia: ${paymentInfo.concepto}
  `.trim();

  const qrBase64 = await QRCode.toDataURL(qrText);

  return { qrBase64, paymentInfo };
}

module.exports = { generatePaymentQR };