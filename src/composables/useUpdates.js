import { ref } from 'vue';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Dialog } from '@capacitor/dialog';

// Global state para persistir en toda la app
const updateAvailable = ref(false);
const updateVersion = ref('');

export function useUpdates() {
  async function initUpdates() {
    try {
      await CapacitorUpdater.notifyAppReady();

      // Cuando autoUpdate es true, Capgo descarga en segundo plano automáticamente.
      // Escuchamos cuando termine para avisarle a la campanita.
      CapacitorUpdater.addListener('download', (info) => {
        if (info && info.version) {
          updateAvailable.value = true;
          updateVersion.value = info.version;
        }
      });
      
    } catch (e) {
      console.error('Error al inicializar actualizaciones OTA:', e);
    }
  }

  async function promptUpdate() {
    if (!updateAvailable.value) return;

    const changelog = "• Mejoras visuales.\n• Corrección de errores menores.\n• Nuevas funciones disponibles.";
    
    const { value } = await Dialog.confirm({
      title: '¡Nueva Versión Disponible!',
      message: `Hay una actualización lista para descargar (v${updateVersion.value}).\n\nNovedades:\n${changelog}\n\n¿Deseas descargarla e instalarla ahora?`,
      okButtonTitle: 'Actualizar Ahora',
      cancelButtonTitle: 'Más tarde'
    });
    
    if (value) {
      const bundle = await CapacitorUpdater.download({ version: updateVersion.value });
      if (bundle) {
        await CapacitorUpdater.set({ id: bundle.id });
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
