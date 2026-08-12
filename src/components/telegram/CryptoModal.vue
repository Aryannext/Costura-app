<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content card">
      <h3>{{ mode === 'backup' ? 'Proteger Respaldo' : 'Restaurar Respaldo' }}</h3>

      <div v-if="mode === 'backup'" class="alert-warning" style="background: #ffebee; color: #c62828; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px;">
        ⚠️ <strong>Advertencia Crítica:</strong> Si olvidas esta contraseña será matemáticamente imposible recuperar los datos. No la guardamos en ningún lado.
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <label>Contraseña Maestra</label>
        <div style="display: flex; position: relative;">
          <input :type="showPassword ? 'text' : 'password'" class="input-field" style="width: 100%; padding-right: 40px;" v-model="password" :disabled="isProcessing" placeholder="Ej. mi-secreto-seguro-123" @keyup.enter="confirm" />
          <button @click="showPassword = !showPassword" class="btn-ghost" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); padding: 4px;" type="button">
            {{ showPassword ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
      </div>

      <p v-if="isProcessing" class="hint" style="color: var(--primary); font-weight: bold; margin-bottom: 12px;">⏳ Procesando cifrado de alta seguridad...</p>
      <p v-if="error" class="hint" style="color: #c62828; font-weight: bold; margin-bottom: 12px;">{{ error }}</p>

      <div class="modal-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn-ghost" @click="cancel" :disabled="isProcessing">Cancelar</button>
        <button class="btn-primary" @click="confirm" :disabled="!password || isProcessing">
          {{ mode === 'backup' ? 'Cifrar y Enviar' : 'Descifrar e Importar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  mode: String,
  isProcessing: Boolean,
  error: String
});

const emit = defineEmits(['close', 'confirm']);
const password = ref('');
const showPassword = ref(false);

watch(() => props.show, (newVal) => {
  if (newVal) {
    password.value = '';
    showPassword.value = false;
  }
});

function cancel() {
  emit('close');
}

function confirm() {
  emit('confirm', password.value);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: var(--surface);
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: var(--on-surface);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
}

.input-field {
  padding: 10px;
  border: 1px solid var(--outline);
  border-radius: var(--radius-sm);
  font-size: 16px;
}

.btn-ghost {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  padding: 8px 16px;
  border: none;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  background: var(--surface-container-high);
  color: var(--on-surface-variant);
  cursor: not-allowed;
}
</style>
