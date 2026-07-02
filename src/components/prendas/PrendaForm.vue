<template>
  <form @submit.prevent="handleSubmit" class="prenda-form">
    <div class="form-group">
      <label for="tipo_prenda">Tipo de Prenda *</label>
      <select id="tipo_prenda" v-model="form.id_tipo_prenda" required>
        <option value="" disabled>Seleccione un tipo</option>
        <option v-for="t in tiposPrenda" :key="t.id_tipo_prenda" :value="t.id_tipo_prenda">
          {{ t.nombre }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="descripcion">Descripción del Arreglo *</label>
      <input 
        type="text" 
        id="descripcion" 
        list="descripciones-sugeridas" 
        v-model="form.descripcion_arreglo" 
        required 
        placeholder="Ej: Ajustar bastilla 2cm..."
      />
      <datalist id="descripciones-sugeridas">
        <option v-for="(desc, index) in descripcionesFrecuentes" :key="index" :value="desc" />
      </datalist>
    </div>

    <div class="form-group">
      <label for="valor">Valor ($) *</label>
      <input type="number" id="valor" v-model.number="form.valor" required min="1" step="0.01" />
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Añadir Prenda' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePrendas } from '../../composables/usePrendas.js';

const { descripcionesFrecuentes, fetchDescripcionesFrecuentes } = usePrendas();

onMounted(() => {
  fetchDescripcionesFrecuentes();
});

const props = defineProps({
  tiposPrenda: {
    type: Array,
    required: true
  },
  loading: Boolean,
  error: String
});

const emit = defineEmits(['submit', 'cancel']);

const form = ref({
  id_tipo_prenda: '',
  descripcion_arreglo: '',
  valor: ''
});

function handleSubmit() {
  emit('submit', { ...form.value });
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
