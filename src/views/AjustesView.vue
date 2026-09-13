<template>
  <div class="ajustes-view">
    <h2 class="titulo">Ajustes</h2>

    <section class="grupo">
      <h3 class="grupo-t">Tu taller</h3>
      <div class="card bloque control">
        <div class="control-fila">
          <span class="fila-t">
            <b>Aviso de entregas próximas</b>
            <small>Días antes de la entrega en que la orden aparece en la campana. Con 0 sólo avisa lo de hoy.</small>
          </span>
          <!-- RN-38: se guarda solo al cambiarlo; ya no hay un botón Guardar gris que parezca roto -->
          <div class="paso-control">
            <button class="paso" :disabled="guardandoDias || diasAnticipacion <= 0" aria-label="Un día menos" @click="cambiarDias(-1)">
              <svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14"></path></svg>
            </button>
            <b class="paso-valor" aria-live="polite">{{ diasAnticipacion }}</b>
            <button class="paso" :disabled="guardandoDias || diasAnticipacion >= DIAS_ANTICIPACION_MAXIMO" aria-label="Un día más" @click="cambiarDias(1)">
              <svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
            </button>
          </div>
        </div>
        <span v-if="diasGuardados" class="guardado">
          <svg class="ic ic16" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
          Guardado · {{ diasAnticipacion === 0 ? 'avisa sólo lo que se entrega hoy' : `avisa desde ${diasAnticipacion} ${diasAnticipacion === 1 ? 'día' : 'días'} antes` }}
        </span>
      </div>
    </section>

    <section class="grupo">
      <h3 class="grupo-t">Notificaciones</h3>
      <div class="card bloque">
        <button class="fila" @click="router.push('/telegram')">
          <span class="fila-t">
            <b>Telegram</b>
            <small>{{ telegramConectado ? 'Conectado · recibos, avisos y respaldos' : 'Sin conectar · toca para configurarlo' }}</small>
          </span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>
      </div>
    </section>

    <section class="grupo">
      <h3 class="grupo-t">Seguridad</h3>
      <div class="card bloque">
        <button class="fila" @click="router.push('/cambiar-clave')">
          <span class="fila-t"><b>Cambiar contraseña</b><small>La clave con la que entras a la app</small></span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>
      </div>
    </section>

    <section class="grupo">
      <h3 class="grupo-t">Ayuda</h3>
      <div class="card bloque">
        <button class="fila" @click="router.push('/ayuda')">
          <span class="fila-t"><b>Instrucciones y tutorial</b><small>Guía paso a paso por la app</small></span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>
        <button class="fila" @click="triggerManualUpdate">
          <span class="fila-t">
            <b>Buscar actualización</b>
            <small>Tienes la versión {{ currentVersion }}<template v-if="currentBundleId"> · {{ currentBundleId }}</template></small>
          </span>
          <svg class="ic chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg>
        </button>
      </div>
    </section>

    <div class="card bloque">
      <button class="fila fila--peligro" @click="handleLogout">
        <svg class="ic" viewBox="0 0 24 24"><path d="M17 16l4-4-4-4"></path><path d="M21 12H7"></path><path d="M13 16v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1"></path></svg>
        <b>Cerrar sesión</b>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '../services/auth.js';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { useUpdates } from '../composables/useUpdates.js';
import { useConfiguracionNegocio } from '../composables/useConfiguracionNegocio.js';
import { leerConfigTelegram } from '../composables/useTelegramBot.js';
import { DIAS_ANTICIPACION_MAXIMO } from '../services/vencimientos.js';

const router = useRouter();
const toast = inject('toast');
const currentVersion = ref('de desarrollo');
const currentBundleId = ref('');
const { manualCheck } = useUpdates();

// RN-38: el período de anticipación de "próximas a vencer" lo decide el negocio.
const { diasAnticipacion, cargarDiasAnticipacion, guardarDiasAnticipacion } = useConfiguracionNegocio();
const guardandoDias = ref(false);
const diasGuardados = ref(false);
const telegramConectado = ref(false);

async function cambiarDias(delta) {
  guardandoDias.value = true;
  try {
    await guardarDiasAnticipacion(diasAnticipacion.value + delta);
    diasGuardados.value = true;
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    guardandoDias.value = false;
  }
}

function triggerManualUpdate() {
  manualCheck(toast);
}

onMounted(async () => {
  await cargarDiasAnticipacion();

  try {
    const { botToken, chatId } = await leerConfigTelegram();
    telegramConectado.value = !!botToken && !!chatId;
  } catch (e) {
    telegramConectado.value = false;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const { bundle } = await CapacitorUpdater.current();
      if (bundle) {
        currentVersion.value = bundle.version;
        currentBundleId.value = bundle.id === 'builtin' ? '' : bundle.id;
      }
    } catch (e) {
      console.warn("No se pudo obtener la versión de Capgo", e);
    }
  }
});

function handleLogout() {
  logout();
  router.push('/login');
}
</script>

<style scoped>
.ajustes-view {
  padding: 20px 16px 80px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.ic { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.ic16 { width: 16px; height: 16px; }
.titulo { margin: 0; font-size: 24px; line-height: 30px; font-weight: 700; letter-spacing: -0.03em; color: var(--on-surface); }

.grupo { display: flex; flex-direction: column; gap: 8px; }
.grupo-t { margin: 0; padding: 0 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--outline); }

.bloque { margin: 0; padding: 0; overflow: hidden; }
.fila {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 16px;
  background: transparent;
  color: var(--on-surface);
  border-radius: 0;
  text-align: left;
  font-weight: 400;
}
.fila + .fila { border-top: 1px solid var(--surface-container-high); }
.fila:hover:not(:disabled) { background: var(--surface-container-low); transform: none; box-shadow: none; }
.fila-t { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fila-t b { font-size: 15px; font-weight: 600; }
.fila-t small { font-size: 13px; color: var(--on-surface-variant); }
.chevron { color: var(--outline); }
.fila--peligro { min-height: 52px; color: var(--error); }
.fila--peligro b { font-size: 15px; font-weight: 600; }

.control { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.control-fila { display: flex; align-items: center; gap: 12px; }
.paso-control { display: flex; align-items: center; gap: 6px; flex: none; }
.paso {
  width: 44px;
  min-height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  color: var(--primary);
}
.paso:hover:not(:disabled) { background: var(--surface-container-low); box-shadow: none; transform: none; }
.paso:disabled { background: var(--surface-container-lowest); color: var(--outline-variant); opacity: 1; }
.paso-valor { width: 28px; text-align: center; font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.guardado { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--success-text); }
</style>
