import { ref } from 'vue';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Global state para persistir en toda la app
const updateAvailable = ref(false);
const updateVersion = ref('');
const bundleIdToApply = ref('');
const isChecking = ref(false);

// Compara versiones semver: "1.1.10" es más nueva que "1.1.2"
function isNewer(v1, v2) {
  if (!v1 || !v2) return false;
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 !== num2) return num1 > num2;
  }
  return false;
}

function marcarDisponible(bundle) {
  updateAvailable.value = true;
  updateVersion.value = bundle.version;
  bundleIdToApply.value = bundle.id;
}

// El aviso en pantalla es opcional: quien llama puede no pasarlo
function avisar(toast, mensaje, tipo) {
  toast?.(mensaje, tipo);
}

export function useUpdates() {
  async function initUpdates() {
    try {
      // 1. Notifica a Capgo que la app cargó bien para evitar rollbacks
      await CapacitorUpdater.notifyAppReady();

      // 2. Revisar si YA hay una actualización descargada y esperando
      try {
        const { bundles } = await CapacitorUpdater.list();
        const { bundle: currentBundle } = await CapacitorUpdater.current();
        
        // Buscar algún bundle descargado con éxito que sea MAYOR que el actual
        const pendingBundle = bundles?.find(b => 
          b.id !== currentBundle.id && 
          b.status === 'success' && 
          isNewer(b.version, currentBundle.version)
        );
        
        if (pendingBundle) marcarDisponible(pendingBundle);
      } catch (err) {
        console.warn("No se pudo verificar lista local de bundles", err);
      }

      // 3. Escuchar cuando Capgo termine de descargar una actualización
      CapacitorUpdater.addListener('downloadComplete', (event) => {
        if (event?.bundle?.version) marcarDisponible(event.bundle);
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
      avisar(toast, "Buscando actualizaciones en la nube...", "info");
      const latest = await CapacitorUpdater.getLatest();
      if (!latest?.url) {
        avisar(toast, "Ya tienes la versión más reciente instalada.", "info");
        return;
      }

      avisar(toast, "¡Actualización encontrada! Descargando...", "info");
      const bundle = await CapacitorUpdater.download({
        version: latest.version,
        url: latest.url
      });
      marcarDisponible(bundle);
      avisar(toast, `¡Descarga completada! (v${bundle.version}). Toca la campana para instalar.`, "success");
    } catch (e) {
      // Capgo responde con un error "up_to_date" cuando no hay nada nuevo
      if (e?.message?.includes('up_to_date')) {
        avisar(toast, "Estás en la última versión.", "info");
      } else {
        avisar(toast, "Error al buscar actualizaciones. Verifica tu conexión.", "error");
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
