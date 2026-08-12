import { useTelegramBot } from './useTelegramBot.js';
import { useOrdenes } from './useOrdenes.js';

export function useTelegramReports(toast) {
    const { sendTelegramMessage } = useTelegramBot();
    const { ordenes, fetchOrdenes } = useOrdenes();

    async function generarReporte() {
        try {
            await fetchOrdenes();
            const activas = ordenes.value.filter(o => o.id_estado_orden < 4);
            const terminadas = ordenes.value.filter(o => o.id_estado_orden === 3);
            const atrasadas = activas.filter(o => new Date(o.fecha_entrega) < new Date());

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
