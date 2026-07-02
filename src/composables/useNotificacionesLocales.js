import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from '../database/connection.js';

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

    const scheduleDailyReminders = async () => {
        try {
            // Verificar permisos
            const status = await LocalNotifications.checkPermissions();
            if (status.display !== 'granted') return;

            // Obtener órdenes a entregar hoy
            // Buscamos órdenes en estado 2 (En proceso) o 3 (Lista para entregar) o 1 (Pendiente)
            // cuya fecha estimada sea HOY.
            const hoyStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            const result = await db.query(`
                SELECT COUNT(*) as pendientes_hoy 
                FROM orden_trabajo 
                WHERE date(fecha_entrega_estimada) = ? AND id_estado_orden < 4
            `, [hoyStr]);

            let pendientes = 0;
            if (result.values && result.values.length > 0) {
                pendientes = result.values[0].pendientes_hoy;
            }

            // Cancelar programaciones previas para evitar duplicados
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

            if (pendientes > 0) {
                // Programar notificación diaria a las 8:00 AM
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: 'Entregas de Hoy 👗',
                            body: `Tienes ${pendientes} orden(es) programadas para entregar el día de hoy. ¡Revisa el taller!`,
                            id: 1,
                            schedule: { 
                                on: { hour: 8, minute: 0 },
                                repeats: true 
                            },
                            sound: null,
                            attachments: null,
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
            }
        } catch (e) {
            console.warn("Fallo al programar notificaciones", e);
        }
    };

    return {
        requestPermissions,
        scheduleDailyReminders
    };
}
