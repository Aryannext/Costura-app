import { createApp } from 'vue';
import './assets/css/style.css';
import App from './App.vue';
import router from './router/index.js';
import { initDatabase } from './database/connection.js';
import { setupDefaultUser } from './database/queries/auth.js';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { useUpdates } from './composables/useUpdates.js';
import { initAppLock } from './composables/useAppLock.js';
import { initPhotoStorage } from './services/photoStorage.js';
import { migrarConfigTelegramDesdeLocalStorage } from './composables/useTelegramBot.js';
import { normalizarRutasDeFotos } from './database/queries/prendas.js';
import { useNotificacionesLocales } from './composables/useNotificacionesLocales.js';

async function bootstrap() {
    try {
        await initDatabase();
        await setupDefaultUser();
    } catch (e) {
        console.error("Failed to initialize database", e);
        const errorDiv = document.createElement('div');
        errorDiv.style.padding = '20px';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontFamily = 'sans-serif';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginTop = '50px';

        const errorTitle = document.createElement('h2');
        errorTitle.textContent = 'Error Crítico';

        const errorSub = document.createElement('p');
        errorSub.textContent = 'No se pudo inicializar la base de datos.';

        const errorMsg = document.createElement('p');
        const small = document.createElement('small');
        small.textContent = e.message || JSON.stringify(e);
        errorMsg.appendChild(small);

        errorDiv.appendChild(errorTitle);
        errorDiv.appendChild(errorSub);
        errorDiv.appendChild(errorMsg);

        document.body.appendChild(errorDiv);
        return; // Halt bootstrap completely
    }

    // Puestas al día que se ejecutan en cada arranque y no hacen nada si ya
    // están aplicadas. Aparte del bloque anterior a propósito: si una falla, la
    // app tiene que abrir igual. Sin base de datos no hay taller; sin normalizar
    // una ruta de foto, sí.
    try {
        await initPhotoStorage();
        await migrarConfigTelegramDesdeLocalStorage();
        await normalizarRutasDeFotos();

        // Rearmar los recordatorios en cada arranque, no sólo al abrir el panel:
        // así las cuentas de cada día se refrescan aunque la dueña entre directa
        // a otra pantalla. No pide permisos, sólo usa los que ya haya.
        await useNotificacionesLocales().scheduleDailyReminders();
    } catch (e) {
        console.error("Fallo en las puestas al día de arranque", e);
    }

    const app = createApp(App);
    app.use(router);
    app.mount('#app');

    // Initialize Capgo OTA Updates
    // Ninguna de las dos puede tumbar el arranque: si fallan, solo se registra
    const { initUpdates } = useUpdates();
    initUpdates().catch(e => console.warn("No se pudieron iniciar las actualizaciones OTA", e));

    // Bloqueo de la sesión al volver del segundo plano
    initAppLock().catch(e => console.warn("No se pudo iniciar el bloqueo de la app", e));

    // Configure Native Polish (Status Bar & Splash Screen)
    if (Capacitor.isNativePlatform()) {
        try {
            // Set status bar to transparent/white and icons to dark
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: '#ffffff' });

            // Hide splash screen since app is now loaded
            await SplashScreen.hide();
        } catch (e) {
            console.warn("Native plugins not available or failed", e);
        }
    }
}

try {
    await bootstrap();
} catch (e) {
    console.error("Fallo inesperado al arrancar", e);
}
