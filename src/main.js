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

    const app = createApp(App);
    app.use(router);
    app.mount('#app');

    // Initialize Capgo OTA Updates
    const { initUpdates } = useUpdates();
    initUpdates();

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

bootstrap();
