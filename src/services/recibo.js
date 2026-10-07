import { pesos } from './whatsapp.js';

function fecha(texto) {
    if (!texto) return '—';
    const [anio, mes, dia] = String(texto).split('T')[0].split(' ')[0].split('-');
    return `${dia}/${mes}/${anio}`;
}

// Recibo de la orden en texto plano, para compartir por WhatsApp o enviarlo a Telegram.
// Incluye lo que identifica el trabajo: fecha de recepción, cada prenda con su arreglo
// y valor, abonos, saldo y fecha de entrega (antes usaba un campo inexistente, A11).
export function construirRecibo(orden, prendas = [], pagos = [], taller = '') {
    const lineas = [];
    lineas.push(`🧾 RECIBO – ${taller || 'Taller de arreglos'}`);
    lineas.push(`Orden #${orden.id_orden}`);
    lineas.push(`Cliente: ${orden.cliente_nombre}`);
    lineas.push(`Recibido: ${fecha(orden.fecha_creacion)}`);
    lineas.push(`Entrega estimada: ${fecha(orden.fecha_entrega_estimada)}`);
    lineas.push(`Estado: ${orden.estado_nombre}`);
    lineas.push('');
    lineas.push('PRENDAS');
    if (prendas.length === 0) lineas.push('  (sin prendas registradas)');
    prendas.forEach((p, i) => {
        lineas.push(`${i + 1}. ${p.tipo_nombre} – ${p.descripcion_arreglo}: ${pesos(p.valor)}`);
    });
    lineas.push('');
    lineas.push(`Total: ${pesos(orden.valor_total)}`);
    if (pagos.length > 0) {
        lineas.push('ABONOS');
        pagos.forEach(p => lineas.push(`  ${fecha(p.fecha_pago)} ${p.metodo_nombre}: ${pesos(p.valor)}`));
    }
    lineas.push(`Saldo pendiente: ${pesos(orden.saldo_pendiente)}`);
    return lineas.join('\n');
}
