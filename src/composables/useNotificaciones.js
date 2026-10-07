import { ref } from 'vue';
import { createNotificacion, getNotificacionesByOrden, getNotificacionesByCliente, getOrdenesParaRecordar } from '../database/queries/notificaciones.js';
import { useAsyncAction } from './useAsyncAction.js';
import { useTelegramBot } from './useTelegramBot.js';
import { getConfig } from '../database/queries/configuracion.js';
import { enlaceWhatsApp, mensajes } from '../services/whatsapp.js';

export function useNotificaciones() {
    const notificaciones = ref([]);
    const { loading, error, execute } = useAsyncAction();
    const { sendTelegramMessage } = useTelegramBot();

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

    // Envía a la modista UN mensaje de Telegram con un enlace de WhatsApp por
    // cliente a recordar. Solo se registra si Telegram confirmó el envío (A02).
    const triggerRecordatorios = async () => {
        return execute(async () => {
            const ordenes = await getOrdenesParaRecordar();
            if (ordenes.length === 0) return 0;

            const taller = (await getConfig('nombre_taller')) || 'el taller';
            const lineas = ordenes.map(o =>
                `• Orden #${o.id_orden} – ${o.cliente_nombre}: ${enlaceWhatsApp(o.cliente_telefono, mensajes.recordatorioRecoger(o, taller))}`);
            const texto = `🔔 Recordatorios de hoy (${ordenes.length})\nToca cada enlace para avisar por WhatsApp:\n\n${lineas.join('\n')}`;

            // Texto plano: los enlaces rompen el Markdown de Telegram
            const enviado = await sendTelegramMessage(texto, null);
            if (!enviado) {
                throw new Error('No se pudo enviar a Telegram (revisa la configuración o el internet). No se registró ningún recordatorio.');
            }
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
