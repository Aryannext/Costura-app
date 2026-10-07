import { useTelegramBot } from './useTelegramBot.js';
import { useOrdenes } from './useOrdenes.js';
import { esOrdenActiva, ESTADO_ORDEN } from '../services/estadoOrden.js';
import { clasificarVencimiento, VENCIMIENTO } from '../services/vencimientos.js';

/**
 * Cifras del reporte diario. Pura para poder probarla.
 * RN-04: sólo cuentan las órdenes activas, con prendas y sin cerrar.
 */
export function resumirOrdenes(ordenes, hoy = new Date()) {
    const activas = ordenes.filter(esOrdenActiva);
    return {
        activas: activas.length,
        listas: activas.filter(o => o.id_estado_orden === ESTADO_ORDEN.LISTA).length,
        // Antes filtraba por `o.fecha_entrega`, una columna que no existe: la
        // fecha salía inválida y el reporte decía siempre cero atrasadas.
        atrasadas: activas.filter(
            o => clasificarVencimiento(o.fecha_entrega_estimada, hoy, 0) === VENCIMIENTO.ATRASADA
        ).length
    };
}

export function useTelegramReports(toast) {
    const { sendTelegramMessage } = useTelegramBot();
    const { ordenes, fetchOrdenes } = useOrdenes();

    async function generarReporte() {
        try {
            await fetchOrdenes();
            const { activas, listas, atrasadas } = resumirOrdenes(ordenes.value);

            let reporte = `📊 *Reporte Diario - Costura App*\n\n`;
            reporte += `🔹 *Órdenes Activas:* ${activas}\n`;
            reporte += `✅ *Listas para Entregar:* ${listas}\n`;
            if (atrasadas > 0) {
                reporte += `⚠️ *Órdenes Atrasadas:* ${atrasadas}\n`;
            }

            const success = await sendTelegramMessage(reporte, 'Markdown');
            if (success) toast('Reporte diario enviado.', 'success');
            else toast('Error al enviar reporte.', 'error');
            return success;
        } catch (e) {
            console.error("Reporte Error:", e);
            toast('Error al generar reporte.', 'error');
            return false;
        }
    }

    return {
        generarReporte
    };
}
