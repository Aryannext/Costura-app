<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <h3 class="headline-sm">¡Nueva Versión Disponible!</h3>
      <p class="body-md" style="margin: 12px 0;">Hay una actualización lista para instalar <strong>(v{{ version }})</strong>.</p>
      
      <div class="changelog">
        <strong>Novedades:</strong>
        <p style="margin: 4px 0 0 0; white-space: pre-line;">{{ changelog }}</p>
      </div>
      
      <p class="body-md" style="margin-bottom: 24px;">¿Deseas reiniciar la aplicación para aplicarla ahora?</p>

      <div class="modal-actions">
        <button class="btn-ghost" @click="$emit('cancel')">Más Tarde</button>
        <button class="btn-primary" @click="$emit('confirm')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 20px; height: 20px; margin-right: 8px; vertical-align: bottom;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reiniciar y Actualizar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  version: String,
  changelog: String
});
defineEmits(['cancel', 'confirm']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.modal-content {
  background-color: var(--surface);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.changelog {
  background-color: var(--surface-container);
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  font-size: 14px;
  color: var(--on-surface-variant);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
