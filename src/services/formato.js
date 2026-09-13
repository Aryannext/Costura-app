/**
 * Pesos colombianos para mostrar: $20.000, sin decimales.
 *
 * Antes cada pantalla imprimía el número crudo ($20000) y Reportes usaba
 * toLocaleString(), cuyo resultado cambia según el idioma del teléfono.
 * `useGrouping: 'always'` porque las variantes de español no agrupan los
 * números de cuatro cifras por defecto ($1000 en vez de $1.000).
 */
const pesos = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, useGrouping: 'always' });

export function formatearMoneda(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return '$0';
    const texto = `$${pesos.format(Math.abs(numero))}`;
    return numero < 0 ? `-${texto}` : texto;
}
