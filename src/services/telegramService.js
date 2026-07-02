const PLANTILLAS = {
    LISTA_ENTREGA: "Hola [Nombre Cliente], te informamos que tu orden #[ID Orden] ya se encuentra lista para ser retirada en el taller. ¡Te esperamos!",
    RECORDATORIO_PAGO: "Hola [Nombre Cliente], te recordamos que tienes un saldo pendiente de $[Saldo] por tu orden #[ID Orden].",
    CREACION_ORDEN: "Hola [Nombre Cliente], hemos recibido tus prendas. Tu orden es la #[ID Orden] y estimamos tenerla lista para el [Fecha Entrega]."
};

export function generateTelegramLink(telefono, tipo, datos) {
    if (!PLANTILLAS[tipo]) {
        throw new Error("Tipo de plantilla no válido");
    }

    let mensaje = PLANTILLAS[tipo];
    
    if (datos.nombreCliente) mensaje = mensaje.replace('[Nombre Cliente]', datos.nombreCliente);
    if (datos.idOrden) mensaje = mensaje.replace('[ID Orden]', datos.idOrden);
    if (datos.saldo) mensaje = mensaje.replace('[Saldo]', datos.saldo);
    if (datos.fechaEntrega) mensaje = mensaje.replace('[Fecha Entrega]', datos.fechaEntrega);

    // Formatear teléfono (quitar caracteres no numéricos)
    let phone = telefono.replace(/\D/g, ''); 
    
    // Telegram format: https://t.me/+NUMERO?text=MENSAJE
    // If the phone number is just 10 digits (common in many countries like Colombia), 
    // it ideally needs the country code. For now we assume the owner inputs the country code 
    // or we append + just in case they added it without the sign.
    const urlEncodedText = encodeURIComponent(mensaje);
    return `https://t.me/+${phone}?text=${urlEncodedText}`;
}

export function openTelegram(telefono, tipo, datos) {
    if (!telefono) {
        alert("El cliente no tiene un teléfono registrado.");
        return;
    }
    const url = generateTelegramLink(telefono, tipo, datos);
    window.open(url, '_blank');
}
