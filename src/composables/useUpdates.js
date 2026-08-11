import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Dialog } from '@capacitor/dialog';
import { inject } from 'vue';

export function useUpdates() {
  async function initUpdates() {
    try {
      // 1. Informa a Capgo que la app cargó bien (evita rollback automático)
      await CapacitorUpdater.notifyAppReady();

      // 2. Escucha el evento cuando se termine de descargar una actualización en segundo plano
      CapacitorUpdater.addListener('download', async (info) => {
        // Puedes enriquecer el changelog conectando tu propio JSON aquí
        const changelog = "• Mejoras de rendimiento.\n• Corrección de errores menores.\n• Nuevas funciones disponibles.";
        
        const { value } = await Dialog.confirm({
          title: '¡Nueva Versión Disponible!',
          message: `Hay una actualización lista para instalar (v${info.version}).\n\nNovedades:\n${changelog}\n\n¿Deseas reiniciar la app para aplicarla ahora?`,
          okButtonTitle: 'Actualizar Ahora',
          cancelButtonTitle: 'Más tarde'
        });
        
        if (value) {
          // Si acepta, aplica la actualización (la app se reiniciará al instante)
          await CapacitorUpdater.set({ id: info.version });
        }
      });
      
      // Opcional: Si tienes autoUpdate desactivado en capacitor.config.json,
      // puedes llamar a CapacitorUpdater.download() manualmente aquí después de consultar tu API.

    } catch (e) {
      console.error('Error al inicializar actualizaciones OTA:', e);
    }
  }

  return { initUpdates };
}
