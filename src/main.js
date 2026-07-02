import { createApp } from 'vue';
import './assets/css/style.css';
import App from './App.vue';
import router from './router/index.js';
import { initDatabase } from './database/connection.js';
import { setupDefaultUser } from './database/queries/auth.js';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

async function bootstrap() {
    try {
        await initDatabase();
        await setupDefaultUser();
    } catch (e) {
        console.error("Failed to initialize database", e);
        // We could render an error page here if DB fails
    }
    
    const app = createApp(App);
    app.use(router);
    app.mount('#app');

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
