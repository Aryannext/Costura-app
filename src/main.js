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
        alert("Error de BD: " + (e.message || JSON.stringify(e)));
        // We could render an error page here if DB fails
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
