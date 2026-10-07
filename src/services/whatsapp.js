// Avisos al cliente por WhatsApp sin costo.
// Se usa el enlace público wa.me ("click to chat"): abre WhatsApp con el mensaje
// ya escrito y la modista solo pulsa Enviar. No requiere servidor, API de pago
// ni cuenta de WhatsApp Business. Contra: no es automático, alguien debe pulsar Enviar.

const INDICATIVO_COLOMBIA = '57';

// wa.me exige el número internacional sin '+'. Los clientes se registran
// normalmente con 10 dígitos (3001234567), así que se antepone el 57.
export function normalizarTelefono(telefono) {
    const digitos = String(telefono || '').replace(/\D/g, '');
    if (digitos.length === 10 && digitos.startsWith('3')) {
        return INDICATIVO_COLOMBIA + digitos;
    }
    return digitos;
}

export function enlaceWhatsApp(telefono, texto) {
    const numero = normalizarTelefono(telefono);
    if (!numero) throw new Error('El cliente no tiene un teléfono registrado.');
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function abrirWhatsApp(telefono, texto) {
    window.open(enlaceWhatsApp(telefono, texto), '_blank');
}

function pesos(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

function primerNombre(nombre) {
    return String(nombre || '').trim().split(/\s+/)[0] || '';
}

// Plantillas de mensaje. 'taller' es el nombre del negocio configurado en Ajustes.
export const mensajes = {
    recibida(orden, prendas, taller) {
        const lista = prendas.map(p => `• ${p.tipo_nombre}: ${p.descripcion_arreglo}`).join('\n');
        return `Hola ${primerNombre(orden.cliente_nombre)} 👋\n` +
            `Recibimos tus prendas en ${taller}. Tu orden es la *#${orden.id_orden}*.\n\n` +
            (lista ? `${lista}\n\n` : '') +
            `Te la tendremos lista para el *${formatoCorto(orden.fecha_entrega_estimada)}*. ¡Gracias por confiar en nosotros! 🧵`;
    },

    enProceso(orden, taller) {
        return `Hola ${primerNombre(orden.cliente_nombre)} 😊\n` +
            `Te cuento que ya estamos trabajando en tu orden *#${orden.id_orden}* en ${taller}. ` +
            `Te avisamos apenas esté lista. 🪡`;
    },

    lista(orden, taller) {
        let texto = `¡Hola ${primerNombre(orden.cliente_nombre)}! 🎉\n` +
            `Tu orden *#${orden.id_orden}* ya está lista en ${taller}. ` +
            `Puedes pasar a recogerla (y medírtela si quieres).`;
        if (orden.saldo_pendiente > 0) texto += `\nSaldo pendiente: *${pesos(orden.saldo_pendiente)}*.`;
        return texto + `\n¡Te esperamos! 👗`;
    },

    recordatorioRecoger(orden, taller) {
        return `Hola ${primerNombre(orden.cliente_nombre)} 👋\n` +
            `Te recordamos que tu orden *#${orden.id_orden}* sigue lista en ${taller} esperando por ti. ` +
            `¿Cuándo te queda bien pasar por ella?`;
    },

    recordatorioPago(orden, taller) {
        return `Hola ${primerNombre(orden.cliente_nombre)} 👋\n` +
            `Te escribimos de ${taller} para recordarte que tu orden *#${orden.id_orden}* ` +
            `tiene un saldo pendiente de *${pesos(orden.saldo_pendiente)}*. ¡Gracias!`;
    }
};

function formatoCorto(fecha) {
    if (!fecha) return '';
    const [anio, mes, dia] = String(fecha).split(' ')[0].split('-');
    return `${dia}/${mes}/${anio}`;
}

export { pesos };
