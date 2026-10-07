import { ref } from 'vue';
import { createNotificacion, getNotificacionesByOrden, getNotificacionesByCliente, getOrdenesParaRecordar } from '../database/queries/notificaciones.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useTelegramBot } from './useTelegramBot.js';
import { enlaceWhatsApp, mensajes } from '../services/whatsapp.js';
import { getConfig } from '../database/queries/configuracion.js';

export function useNotificaciones() {
    const notificaciones = ref([]);
    const { loading, error, execute } = useAsyncAction();
    const { sendTelegramMessage, isConfigured } = useTelegramBot();

    const fetchNotificaciones = async (id_orden) => {
        return execute(async () => {
            notificaciones.value = await getNotificacionesByOrden(id_orden);
        });
    };

    const fetchNotificacionesCliente = async (id_cliente) => {
        return execute(async () => {
            notificaciones.value = await getNotificacionesByCliente(id_cliente);
        });
    };

    const saveNotificacion = async (mensaje, id_orden, id_tipo_notificacion) => {
        return execute(async () => {
            await createNotificacion(mensaje, id_orden, id_tipo_notificacion);
        });
    };

    // Envía a la modista UN mensaje de Telegram con un enlace de WhatsApp por cada orden Lista.
    // Solo se registra el recordatorio si Telegram confirmó el envío (A02).
    // Devuelve la cantidad de órdenes incluidas.
    const triggerRecordatorios = async () => {
        return execute(async () => {
            if (!isConfigured()) {
                throw new Error('Configura el bot de Telegram en Ajustes para enviar recordatorios.');
            }
            const ordenes = await getOrdenesParaRecordar();
            if (ordenes.length === 0) return 0;

            const taller = (await getConfig('nombre_taller')) || 'el taller';
            let texto = `🔔 Recordatorios de hoy (${ordenes.length})\nToca cada enlace para avisar por WhatsApp:\n\n`;
            for (const o of ordenes) {
                const link = enlaceWhatsApp(o.cliente_telefono, mensajes.recordatorioRecoger(o, taller));
                texto += `• Orden #${o.id_orden} – ${o.cliente_nombre}: ${link}\n`;
            }

            // Sin parse_mode: los enlaces con caracteres especiales rompen el Markdown de Telegram
            const enviado = await sendTelegramMessage(texto, null);
            if (!enviado) throw new Error('Telegram no confirmó el envío. No se registró ningún recordatorio.');

            for (const o of ordenes) {
                await createNotificacion('Recordatorio para recoger enviado a tu Telegram', o.id_orden, 3);
            }
            return ordenes.length;
        }, { toastError: true });
    };

    return {
        notificaciones,
        loading,
        error,
        fetchNotificaciones,
        fetchNotificacionesCliente,
        saveNotificacion,
        triggerRecordatorios
    };
}
