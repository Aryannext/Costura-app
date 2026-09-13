import { LocalNotifications } from '@capacitor/local-notifications';
import { getEntregasPorDia } from '../database/queries/ordenes.js';
import { fechaLocalISO, aFechaLocal, sumarDias, diasDeDiferencia } from '../services/fechas.js';

export const HORA_RECORDATORIO = 8;
export const DIAS_A_PROGRAMAR = 7;

/**
 * Bloque de identificadores reservado para los recordatorios diarios. Se cancela
 * entero antes de rearmar, para que no sobrevivan avisos de una programación
 * anterior con cuentas ya obsoletas.
 */
export const ID_BASE_RECORDATORIO = 1000;

/** El id 1 lo usaba la notificación repetitiva de versiones anteriores. */
const ID_RECORDATORIO_HEREDADO = 1;

/**
 * Construye un aviso por cada día con entregas, con la cuenta real de ese día.
 *
 * La versión anterior programaba UNA notificación repetitiva: el cuerpo se
 * congelaba con la cuenta del día en que se programó y a partir de ahí mentía
 * cada mañana. Aquí cada día lleva su propio aviso de disparo único.
 *
 * Función pura para poder probar el calendario sin tocar el reloj del sistema.
 */
export function construirRecordatorios(entregasPorDia, ahora = new Date()) {
    const notificaciones = [];

    for (const { dia, total } of entregasPorDia || []) {
        if (!dia || !total) continue;

        const cuando = aFechaLocal(dia);
        cuando.setHours(HORA_RECORDATORIO, 0, 0, 0);

        // Un aviso cuya hora ya pasó no se programa: Android lo dispararía al
        // instante y la dueña recibiría la alarma de las 8 a las 3 de la tarde.
        if (cuando <= ahora) continue;

        const desplazamiento = diasDeDiferencia(ahora, dia);
        if (desplazamiento < 0 || desplazamiento >= DIAS_A_PROGRAMAR) continue;

        notificaciones.push({
            id: ID_BASE_RECORDATORIO + desplazamiento,
            title: 'Entregas de hoy 👗',
            body: total === 1
                ? 'Tienes 1 orden para entregar hoy. ¡Revisa el taller!'
                : `Tienes ${total} órdenes para entregar hoy. ¡Revisa el taller!`,
            schedule: { at: cuando, allowWhileIdle: true }
        });
    }

    return notificaciones;
}

export function useNotificacionesLocales() {

    const requestPermissions = async () => {
        try {
            const status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (e) {
            console.warn("LocalNotifications no soportado en web", e);
        }
    };

    /**
     * Rearma los recordatorios de los próximos días. Se llama en cada arranque
     * y al abrir el panel, de modo que las cuentas se refrescan solas.
     */
    const scheduleDailyReminders = async () => {
        try {
            const status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') return 0;

            const ahora = new Date();
            const entregas = await getEntregasPorDia(
                fechaLocalISO(ahora),
                fechaLocalISO(sumarDias(ahora, DIAS_A_PROGRAMAR - 1))
            );

            await LocalNotifications.cancel({
                notifications: [
                    { id: ID_RECORDATORIO_HEREDADO },
                    ...Array.from({ length: DIAS_A_PROGRAMAR }, (_, i) => ({ id: ID_BASE_RECORDATORIO + i }))
                ]
            });

            const notificaciones = construirRecordatorios(entregas, ahora);
            if (notificaciones.length > 0) {
                await LocalNotifications.schedule({ notifications: notificaciones });
            }
            return notificaciones.length;
        } catch (e) {
            console.warn("Fallo al programar notificaciones", e);
            return 0;
        }
    };

    return {
        requestPermissions,
        scheduleDailyReminders
    };
}
