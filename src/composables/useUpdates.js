import { ref } from 'vue';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Global state para persistir en toda la app
const updateAvailable = ref(false);
const updateVersion = ref('');

export function useUpdates() {
  async function initUpdates() {
    try {
      // 1. Notifica a Capgo que la app cargó bien para evitar rollbacks
      await CapacitorUpdater.notifyAppReady();

      // 2. Escuchar cuando Capgo termine de descargar la actualización
      CapacitorUpdater.addListener('downloadComplete', (event) => {
        if (event && event.bundle && event.bundle.version) {
          updateAvailable.value = true;
          updateVersion.value = event.bundle.version;
        }
      });
      
    } catch (e) {
      console.error('Error al inicializar actualizaciones OTA:', e);
    }
  }

  async function promptUpdate() {
    if (!updateAvailable.value) return;

    const changelog = "• Mejoras visuales.\n• Corrección de errores menores.\n• Nuevas funciones disponibles.";
    
    const value = window.confirm(
      `¡Nueva Versión Disponible!\n\nHay una actualización lista para instalar (v${updateVersion.value}).\n\nNovedades:\n${changelog}\n\n¿Deseas reiniciar la app para aplicarla ahora?`
    );
    
    if (value) {
      try {
        window.alert("Aplicando actualización... La app se reiniciará en un instante.");
        // Como ya se descargó en segundo plano, set() lo aplica de inmediato
        await CapacitorUpdater.set({ id: updateVersion.value });
      } catch (err) {
        console.error("Error aplicando la actualización:", err);
        window.alert("Hubo un error al aplicar la actualización: " + err.message);
      }
    }
  }

  return { 
    initUpdates,
    promptUpdate,
    updateAvailable,
    updateVersion
  };
}
