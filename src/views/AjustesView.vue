<template>
  <div class="ajustes-view">
    <div class="header">
      <h2 class="display-sm">Ajustes</h2>
      <p class="body-md">Configura las preferencias de la aplicación.</p>
    </div>

    <div class="settings-list">
      <div class="card setting-card" @click="router.push('/ayuda')">
        <div class="setting-info">
          <h4 class="headline-sm">Ayuda e Instrucciones</h4>
          <p class="body-md">Manual de usuario y guía rápida.</p>
        </div>
        <div class="setting-action">
          <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      <div class="card setting-card" @click="router.push('/telegram')">
        <div class="setting-info">
          <h4 class="headline-sm">Notificaciones de Telegram</h4>
          <p class="body-md">Conectar y gestionar alertas.</p>
        </div>
        <div class="setting-action">
          <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>

      <div class="card setting-card" @click="handleLogout">
        <div class="setting-info">
          <h4 class="headline-sm" style="color: var(--error);">Cerrar Sesión</h4>
          <p class="body-md">Salir de la cuenta administrativa.</p>
        </div>
        <div class="setting-action">
          <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="var(--error)"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </div>
      </div>
    </div>
    <div class="version-info" style="text-align: center; margin-top: 32px; color: var(--on-surface-variant); font-size: 14px;">
      <p style="margin: 4px 0;"><strong>Versión de la App:</strong> {{ currentVersion }}</p>
      <p style="margin: 4px 0; font-size: 12px; font-family: monospace;" v-if="currentBundleId">ID: {{ currentBundleId }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '../services/auth.js';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

const router = useRouter();
const currentVersion = ref('1.0.0 (Local/Base)');
const currentBundleId = ref('');

onMounted(async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            const { bundle } = await CapacitorUpdater.current();
            if (bundle) {
                currentVersion.value = bundle.version;
                currentBundleId.value = bundle.id;
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
  padding: 24px 16px 80px 16px;
}
.header {
  margin-bottom: 24px;
}
.header h2 {
  color: var(--on-surface);
  margin-bottom: 8px;
}
.header p {
  color: var(--on-surface-variant);
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.setting-card:hover {
  background-color: var(--surface-container-low);
}

.setting-info h4 {
  margin: 0;
  color: var(--on-surface);
}

.setting-info p {
  margin: 4px 0 0 0;
  color: var(--on-surface-variant);
}

.setting-action .icon {
  width: 24px;
  height: 24px;
  color: var(--on-surface-variant);
}
</style>
