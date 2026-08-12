import { ref } from 'vue';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Global state para persistir en toda la app
const updateAvailable = ref(false);
const updateVersion = ref('');
const bundleIdToApply = ref('');

export function useUpdates() {
  async function initUpdates() {
    try {
      // 1. Notifica a Capgo que la app cargó bien para evitar rollbacks
      await CapacitorUpdater.notifyAppReady();

      // 2. Revisar si YA hay una actualización descargada y esperando
      try {
        const { bundles } = await CapacitorUpdater.list();
        const { bundle: currentBundle } = await CapacitorUpdater.current();
        
        // Buscar algún bundle descargado con éxito que no sea el actual
        const pendingBundle = bundles.find(b => b.id !== currentBundle.id && b.status === 'success');
        if (pendingBundle) {
          updateAvailable.value = true;
          updateVersion.value = pendingBundle.version;
          bundleIdToApply.value = pendingBundle.id;
        }
      } catch (err) {
        console.warn("No se pudo verificar lista local de bundles", err);
      }

      // 3. Escuchar cuando Capgo termine de descargar una actualización
      CapacitorUpdater.addListener('downloadComplete', (event) => {
        if (event && event.bundle && event.bundle.version) {
          updateAvailable.value = true;
          updateVersion.value = event.bundle.version;
          bundleIdToApply.value = event.bundle.id;
        }
      });

      // Alertas de depuración (SOLO para ver por qué falla)
      CapacitorUpdater.addListener('downloadFailed', (event) => {
        alert("Capgo Error - Descarga Fallida: " + JSON.stringify(event));
      });
      
    } catch (e) {
      console.error('Error al inicializar actualizaciones OTA:', e);
    }
  }

  async function manualCheck() {
    try {
      alert("Buscando actualización en la nube...");
      const latest = await CapacitorUpdater.getLatest();
      alert("Respuesta de la nube: " + JSON.stringify(latest));
      
      if (latest && latest.url) {
        alert("¡Actualización encontrada! Descargando...");
        const bundle = await CapacitorUpdater.download({
          version: latest.version,
          url: latest.url
        });
        alert("Descargado con éxito: " + JSON.stringify(bundle));
        updateAvailable.value = true;
        updateVersion.value = bundle.version;
        bundleIdToApply.value = bundle.id;
      } else {
        alert("No hay actualización disponible según la nube.");
      }
    } catch (e) {
      alert("Error en Capgo (manualCheck): " + e.message);
    }
  }

  async function promptUpdate() {
    if (!updateAvailable.value || !bundleIdToApply.value) return;

    const changelog = "• Mejoras visuales.\n• Corrección de errores menores.\n• Nuevas funciones disponibles.";
    
    const value = window.confirm(
      `¡Nueva Versión Disponible!\n\nHay una actualización lista para instalar (v${updateVersion.value}).\n\nNovedades:\n${changelog}\n\n¿Deseas reiniciar la app para aplicarla ahora?`
    );
    
    if (value) {
      try {
        window.alert("Aplicando actualización... La app se reiniciará en un instante.");
        // SE REQUIERE EL ID DEL BUNDLE, NO LA VERSION!
        await CapacitorUpdater.set({ id: bundleIdToApply.value });
      } catch (err) {
        console.error("Error aplicando la actualización:", err);
        window.alert("Hubo un error al aplicar la actualización: " + err.message);
      }
    }
  }

  return { 
    initUpdates,
    manualCheck,
    promptUpdate,
    updateAvailable,
    updateVersion
  };
}
