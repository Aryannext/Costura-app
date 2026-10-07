import { useTelegramBot } from './useTelegramBot.js';
import { useOrdenes } from './useOrdenes.js';
import { hoyLocal } from '../services/fechas.js';

export function useTelegramReports(toast) {
    const { sendTelegramMessage } = useTelegramBot();
    const { ordenes, fetchOrdenes } = useOrdenes();

    async function generarReporte() {
        try {
            await fetchOrdenes();
            const activas = ordenes.value.filter(o => o.id_estado_orden < 4);
            const terminadas = ordenes.value.filter(o => o.id_estado_orden === 3);
            // El campo real es fecha_entrega_estimada (antes fecha_entrega, que no existe: A08).
            // Se comparan textos 'YYYY-MM-DD' locales para no depender de zonas horarias.
            const hoy = hoyLocal();
            const atrasadas = activas.filter(o => o.fecha_entrega_estimada && o.fecha_entrega_estimada.slice(0, 10) < hoy);

            let reporte = `📊 *Reporte Diario - Costura App*\n\n`;
            reporte += `🔹 *Órdenes Activas:* ${activas.length}\n`;
            reporte += `✅ *Listas para Entregar:* ${terminadas.length}\n`;
            if (atrasadas.length > 0) {
                reporte += `⚠️ *Órdenes Atrasadas:* ${atrasadas.length}\n`;
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
