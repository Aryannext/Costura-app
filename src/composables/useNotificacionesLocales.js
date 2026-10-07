import { LocalNotifications } from '@capacitor/local-notifications';

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

            // Una alarma repetitiva no puede consultar la base de datos cuando suena, así que
            // su texto es fijo. Antes llevaba el conteo del día en que se programó y quedaba
            // desactualizado, o no se programaba si ese día había cero entregas (A13).
            // Ahora siempre se programa con un texto general a las 8:00 a. m.
            await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

            {
                // Programar notificación diaria a las 8:00 AM
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: 'Buenos días 👗',
                            body: 'Abre la app para ver qué prendas tienes que entregar hoy.',
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
