<template>
  <form @submit.prevent="handleSubmit" class="cliente-form">
    <div class="form-group">
      <label for="nombre">Nombre *</label>
      <input type="text" id="nombre" v-model="form.nombre" required placeholder="Nombre del cliente" />
    </div>
    <div class="form-group">
      <label for="telefono">Teléfono *</label>
      <input type="tel" id="telefono" v-model="form.telefono" required placeholder="Número de teléfono" />
    </div>
    <div class="form-group">
      <label for="direccion">Dirección</label>
      <input type="text" id="direccion" v-model="form.direccion" placeholder="Dirección (opcional)" />
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({ nombre: '', telefono: '', direccion: '' })
  },
  loading: Boolean,
  error: String
});

const emit = defineEmits(['submit', 'cancel']);

const form = ref({ ...props.initialData });

watch(() => props.initialData, (newVal) => {
  form.value = { ...newVal };
}, { deep: true });

function handleSubmit() {
  emit('submit', form.value);
}
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
.btn-secondary {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.error-message {
  color: var(--error-color);
  margin-bottom: 16px;
  font-size: 0.9em;
}
</style>
