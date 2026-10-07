/**
 * Totales de una orden derivados de su contenido.
 *
 * Antes cada operación sumaba o restaba una diferencia sobre `valor_total` y
 * `saldo_pendiente`. Un error en cualquiera de esas cuentas quedaba grabado para
 * siempre, porque nada volvía a comparar el saldo con las prendas y los pagos
 * reales (P1-4). Ahora la orden se recalcula desde cero dentro de la misma
 * transacción que la modifica: la fuente de verdad son las filas de `prenda` y
 * `pago`, y las dos columnas de `orden_trabajo` son sólo una caché.
 */

export const SQL_RECALCULAR_TOTALES_ORDEN = `
    UPDATE orden_trabajo SET
        valor_total = (
            SELECT COALESCE(SUM(valor), 0) FROM prenda WHERE prenda.id_orden = orden_trabajo.id_orden
        ),
        saldo_pendiente = (
            SELECT COALESCE(SUM(valor), 0) FROM prenda WHERE prenda.id_orden = orden_trabajo.id_orden
        ) - (
            SELECT COALESCE(SUM(valor), 0) FROM pago
            WHERE pago.id_orden = orden_trabajo.id_orden AND pago.anulado_en IS NULL
        )
    WHERE id_orden = ?`;

/**
 * Sentencia lista para añadir a un `executeSet`. Debe ir DESPUÉS de los cambios
 * en `prenda` o `pago`. Al ser un UPDATE no altera `last_insert_rowid()`, así
 * que el `lastId` del set sigue siendo el del INSERT anterior.
 */
export function recalcularTotalesOrden(id_orden) {
    return { statement: SQL_RECALCULAR_TOTALES_ORDEN, values: [id_orden] };
}
