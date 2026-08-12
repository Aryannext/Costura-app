import { ref } from 'vue';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Global state para persistir en toda la app
const updateAvailable = ref(false);
const updateVersion = ref('');
const bundleIdToApply = ref('');
const isChecking = ref(false);

export function useUpdates() {
  async function initUpdates() {
    try {
      // 1. Notifica a Capgo que la app cargó bien para evitar rollbacks
      await CapacitorUpdater.notifyAppReady();

      // 2. Revisar si YA hay una actualización descargada y esperando
      try {
        const { bundles } = await CapacitorUpdater.list();
        const { bundle: currentBundle } = await CapacitorUpdater.current();
        
        // Helper para comparar versiones semver (ej. "1.0.5" > "1.0.4")
        const isNewer = (v1, v2) => {
          if (!v1 || !v2) return false;
          const p1 = v1.split('.').map(Number);
          const p2 = v2.split('.').map(Number);
          for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
            const num1 = p1[i] || 0;
            const num2 = p2[i] || 0;
            if (num1 > num2) return true;
            if (num1 < num2) return false;
          }
          return false;
        };
        
        // Buscar algún bundle descargado con éxito que sea MAYOR que el actual
        const pendingBundle = bundles?.find(b => 
          b.id !== currentBundle.id && 
          b.status === 'success' && 
          isNewer(b.version, currentBundle.version)
        );
        
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
        console.error("Capgo Error - Descarga Fallida: ", event);
      });
      
    } catch (e) {
      console.error('Error al inicializar actualizaciones OTA:', e);
    }
  }

  const showUpdatePrompt = ref(false);

  async function manualCheck(toast) {
    if (isChecking.value) return;
    isChecking.value = true;
    try {
      if (toast) toast("Buscando actualizaciones en la nube...", "info");
      
      const latest = await CapacitorUpdater.getLatest();
      
      if (latest && latest.url) {
        if (toast) toast("¡Actualización encontrada! Descargando...", "info");
        const bundle = await CapacitorUpdater.download({
          version: latest.version,
          url: latest.url
        });
        updateAvailable.value = true;
        updateVersion.value = bundle.version;
        bundleIdToApply.value = bundle.id;
        if (toast) toast(`¡Descarga completada! (v${bundle.version}). Toca la campana para instalar.`, "success");
      } else {
        if (toast) toast("Ya tienes la versión más reciente instalada.", "info");
      }
    } catch (e) {
      if (e.message && e.message.includes('up_to_date')) {
         if (toast) toast("Estás en la última versión.", "info");
      } else {
         if (toast) toast("Error al buscar actualizaciones. Verifica tu conexión.", "error");
      }
    } finally {
      isChecking.value = false;
    }
  }

  function promptUpdate() {
    if (!updateAvailable.value || !bundleIdToApply.value) return;
    showUpdatePrompt.value = true;
  }

  async function applyUpdate() {
    showUpdatePrompt.value = false;
    try {
      // toast must be passed if we want it here, but it's optional. It restarts anyway.
      await CapacitorUpdater.set({ id: bundleIdToApply.value });
    } catch (err) {
      console.error("Error aplicando la actualización:", err);
    }
  }

  return { 
    initUpdates,
    manualCheck,
    promptUpdate,
    applyUpdate,
    updateAvailable,
    updateVersion,
    showUpdatePrompt
  };
}
