// Fechas de calendario en la hora local del teléfono (Colombia = UTC-5).
// No usar toISOString() para obtener "hoy": convierte a UTC y entre las
// 7:00 p. m. y la medianoche devuelve el día siguiente (fallo A09).

function dosDigitos(n) {
    return String(n).padStart(2, '0');
}

// Date -> 'YYYY-MM-DD' usando la hora local
export function aFechaLocal(date = new Date()) {
    return `${date.getFullYear()}-${dosDigitos(date.getMonth() + 1)}-${dosDigitos(date.getDate())}`;
}

export function hoyLocal() {
    return aFechaLocal(new Date());
}

export function sumarDias(dias, desde = new Date()) {
    const d = new Date(desde);
    d.setDate(d.getDate() + dias);
    return aFechaLocal(d);
}

// 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS' -> Date a medianoche local.
// new Date('2026-10-06') lo interpreta como UTC y en Colombia queda en el día 5.
export function parseFechaLocal(texto) {
    if (!texto) return null;
    if (texto instanceof Date) {
        return new Date(texto.getFullYear(), texto.getMonth(), texto.getDate());
    }
    const [anio, mes, dia] = String(texto).split('T')[0].split(' ')[0].split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}
