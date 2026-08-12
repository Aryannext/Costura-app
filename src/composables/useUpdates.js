import { ref } from 'vue';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Dialog } from '@capacitor/dialog';

// Global state para persistir en toda la app
const updateAvailable = ref(false);
const updateVersion = ref('');
const updateLatestObj = ref(null);

export function useUpdates() {
  async function initUpdates() {
    try {
      await CapacitorUpdater.notifyAppReady();

      // Consultar si hay alguna versión más reciente disponible en Capgo
      const latest = await CapacitorUpdater.getLatest();
      
      if (latest && latest.version) {
        updateAvailable.value = true;
        updateVersion.value = latest.version;
        updateLatestObj.value = latest;
      }
      
    } catch (e) {
      console.error('Error al inicializar/consultar actualizaciones OTA:', e);
    }
  }

  async function promptUpdate() {
    if (!updateAvailable.value || !updateLatestObj.value) return;

    const changelog = "• Mejoras visuales.\n• Corrección de errores menores.\n• Nuevas funciones disponibles.";
    
    const { value } = await Dialog.confirm({
      title: '¡Nueva Versión Disponible!',
      message: `Hay una actualización lista para descargar (v${updateVersion.value}).\n\nNovedades:\n${changelog}\n\n¿Deseas descargarla e instalarla ahora?`,
      okButtonTitle: 'Actualizar Ahora',
      cancelButtonTitle: 'Más tarde'
    });
    
    if (value) {
      try {
        const bundle = await CapacitorUpdater.download(updateLatestObj.value);
        if (bundle) {
          await CapacitorUpdater.set(bundle);
        }
      } catch (err) {
        console.error("Error descargando la actualización:", err);
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
